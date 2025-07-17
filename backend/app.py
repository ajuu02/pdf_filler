
from flask import Flask, jsonify, request, send_file, send_from_directory
from flask_cors import CORS
import os
from PyPDF2.generic import NameObject, BooleanObject
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), 'templates')
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
print(f"[DEBUG] DATA_DIR is set to: {DATA_DIR}")

# List all CSVs in the data directory (for DataManager UI)
@app.route('/data_list', methods=['GET'])
def list_all_csvs():
    csvs = [f for f in os.listdir(DATA_DIR) if f.lower().endswith('.csv')]
    return jsonify({'csvs': csvs})
# Upload a new CSV data file
@app.route('/upload_data', methods=['POST'])
def upload_data():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not file.filename.lower().endswith('.csv'):
        return jsonify({'error': 'Only CSV files allowed'}), 400
    filename = secure_filename(file.filename)
    save_path = os.path.join(DATA_DIR, filename)
    file.save(save_path)
    return jsonify({'success': f'CSV {filename} uploaded successfully.'})

# Delete a CSV data file
@app.route('/delete_data', methods=['DELETE'])
def delete_data():
    name = request.args.get('name')
    if not name or not name.lower().endswith('.csv'):
        return jsonify({'error': 'Invalid CSV name'}), 400
    file_path = os.path.join(DATA_DIR, name)
    if not os.path.isfile(file_path):
        return jsonify({'error': 'CSV not found'}), 404
    os.remove(file_path)
    return jsonify({'success': f'CSV {name} deleted successfully.'})

# Robustly serve CSV files from the data directory
@app.route('/datafile/<path:filename>', methods=['GET'])
def serve_data_csv(filename):
    import mimetypes
    from flask import Response
    # Only allow .csv files, prevent directory traversal
    if not filename.lower().endswith('.csv') or '/' in filename or '\\' in filename or '..' in filename:
        return jsonify({'error': 'Only CSV files allowed'}), 400
    file_path = os.path.join(DATA_DIR, filename)
    print(f"[DEBUG] Looking for CSV at: {file_path}")
    if not os.path.isfile(file_path):
        print(f"[DEBUG] File not found: {file_path}")
        return jsonify({'error': 'File not found'}), 404
    # Serve as text/csv with correct headers
    with open(file_path, 'r', encoding='utf-8') as f:
        csv_content = f.read()
    return Response(csv_content, mimetype='text/csv', headers={
        'Content-Disposition': f'inline; filename={filename}'
    })
# Add the /fields endpoint after app is defined
@app.route('/fields', methods=['GET'])
def get_pdf_fields():
    from PyPDF2 import PdfReader
    template = request.args.get('template')
    if not template:
        return jsonify({'error': 'template parameter required'}), 400
    template_path = os.path.join(TEMPLATES_DIR, template)
    if not os.path.exists(template_path):
        return jsonify({'error': 'Template not found'}), 404
    reader = PdfReader(template_path)
    fields = reader.get_fields()
    if not fields:
        return jsonify({'fields': []})
    # Convert PyPDF2 field objects to serializable dicts
    result = []
    for name, obj in fields.items():
        field_info = {'name': name}
        for k, v in obj.items():
            # Only include serializable values
            if isinstance(v, (str, int, float, bool)):
                field_info[k] = v
            elif hasattr(v, 'get_object'):
                try:
                    field_info[k] = str(v.get_object())
                except Exception:
                    field_info[k] = str(v)
            else:
                field_info[k] = str(v)
        result.append(field_info)
    return jsonify({'fields': result})

# Upload a new PDF template
@app.route('/upload_template', methods=['POST'])
def upload_template():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files allowed'}), 400
    filename = secure_filename(file.filename)
    save_path = os.path.join(TEMPLATES_DIR, filename)
    file.save(save_path)
    return jsonify({'success': f'Template {filename} uploaded successfully.'})

# Delete a PDF template
@app.route('/delete_template', methods=['DELETE'])
def delete_template():
    name = request.args.get('name')
    if not name or not name.lower().endswith('.pdf'):
        return jsonify({'error': 'Invalid template name'}), 400
    file_path = os.path.join(TEMPLATES_DIR, name)
    if not os.path.isfile(file_path):
        return jsonify({'error': 'Template not found'}), 404
    os.remove(file_path)
    return jsonify({'success': f'Template {name} deleted successfully.'})
@app.route('/templates/<path:filename>', methods=['GET'])
def serve_template_pdf(filename):
    # Security: only allow files in the templates directory and only PDFs
    if not filename.lower().endswith('.pdf'):
        return jsonify({'error': 'Only PDF files allowed'}), 400
    file_path = os.path.join(TEMPLATES_DIR, filename)
    if not os.path.isfile(file_path):
        return jsonify({'error': 'File not found'}), 404
    return send_from_directory(TEMPLATES_DIR, filename, mimetype='application/pdf', as_attachment=False)

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
