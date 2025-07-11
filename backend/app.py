from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
import os
from PyPDF2.generic import NameObject, BooleanObject

app = Flask(__name__)
CORS(app)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), 'templates')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

@app.route('/templates', methods=['GET'])
def list_templates():
    pdfs = [f for f in os.listdir(TEMPLATES_DIR) if f.lower().endswith('.pdf')]
    return jsonify({'templates': pdfs})

@app.route('/data', methods=['GET'])
def list_csvs():
    template = request.args.get('template')
    if not template:
        return jsonify({'error': 'template parameter required'}), 400
    base = os.path.splitext(template)[0]
    csvs = [f for f in os.listdir(DATA_DIR)
            if f.lower().endswith('.csv') and f.startswith(base)]
    return jsonify({'csvs': csvs})

@app.route('/fill', methods=['POST'])
def fill_pdf():
    import io
    import pandas as pd
    from PyPDF2 import PdfReader, PdfWriter

    data = request.get_json()
    template = data.get('template')
    csv_file = data.get('csv')
    if not template or not csv_file:
        return jsonify({'error': 'template and csv required'}), 400

    template_path = os.path.join(TEMPLATES_DIR, template)
    csv_path = os.path.join(DATA_DIR, csv_file)
    if not os.path.exists(template_path) or not os.path.exists(csv_path):
        return jsonify({'error': 'Template or CSV not found'}), 404

    # Read CSV (first row only)
    df = pd.read_csv(csv_path)
    if df.empty:
        return jsonify({'error': 'CSV is empty'}), 400
    row = df.iloc[0].to_dict()

    # Read PDF and get form fields
    reader = PdfReader(template_path)
    writer = PdfWriter()
    if not reader.pages:
        return jsonify({'error': 'PDF has no pages'}), 400
    fields = reader.get_fields()
    if not fields:
        return jsonify({'error': 'PDF has no form fields'}), 400
    pdf_fields = set(fields.keys())
    csv_fields = set(row.keys())
    unmatched = csv_fields - pdf_fields
    if unmatched:
        return jsonify({'error': f'CSV columns do not match PDF fields: {unmatched}'}), 400

    # Prepare checkbox values: set to 'Yes' if value is truthy, else 'Off'
    for field_name, field in (fields or {}).items():
        if field.get('/FT') == '/Btn':  # Checkbox or radio
            val = row.get(field_name)
            checked = val not in (None, '', 0, False, '0', 'false', 'False', 'Off')
            row[field_name] = 'Yes' if checked else 'Off'
    # Fill form fields on all pages
    writer.append_pages_from_reader(reader)
    for i, page in enumerate(writer.pages):
        writer.update_page_form_field_values(page, row)
        # Manually set /V and /AS for checkboxes using export value
        for field_name, field in (fields or {}).items():
            if field.get('/FT') == '/Btn':
                checked = row.get(field_name) == 'Yes'
                export_value = 'Yes'
                # Try to get export value from /AP if available
                if "/Annots" in page:
                    for annot in page["/Annots"]:
                        obj = annot.get_object()
                        if obj.get("/T") == field_name:
                            ap = obj.get("/AP")
                            if ap and "/N" in ap:
                                n_dict = ap["/N"]
                                for key in n_dict.keys():
                                    if key != "/Off":
                                        export_value = key[1:] if key.startswith("/") else key
                            if checked:
                                obj.update({
                                    NameObject("/V"): NameObject(export_value),
                                    NameObject("/AS"): NameObject(export_value),
                                })
                            else:
                                obj.update({
                                    NameObject("/V"): NameObject("Off"),
                                    NameObject("/AS"): NameObject("Off"),
                                })
    # Set NeedAppearances flag as a BooleanObject
    if "/AcroForm" in writer._root_object:
        writer._root_object["/AcroForm"].update({NameObject("/NeedAppearances"): BooleanObject(True)})
    # Output to memory
    output = io.BytesIO()
    writer.write(output)
    output.seek(0)
    return send_file(output, as_attachment=True, download_name=f'filled_{template}', mimetype='application/pdf')

if __name__ == '__main__':
    os.makedirs(TEMPLATES_DIR, exist_ok=True)
    os.makedirs(DATA_DIR, exist_ok=True)
    app.run(debug=True, port=5050)
