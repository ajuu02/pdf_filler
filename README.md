# PDF Form Filler

A web application to fill PDF forms using CSV data.

## Project Structure

- `backend/` — Flask API, PDF/CSV storage
  - `app.py` — Main Flask app, supports:
    - List PDF templates (`/templates`)
    - List matching CSVs (`/data?template=...`)
    - Fill PDF with CSV data (`/fill`)
    - Robust checkbox support (auto-detects export value)
  - `templates/` — Place your PDF form templates here
  - `data/` — Place your CSV files here (must start with template name)
- `frontend/` — React app
  - Modern, interactive UI
  - Lists templates and CSVs, previews PDFs, downloads filled PDFs

## Quick Start (Development)

### Backend
1. `cd backend`
2. `pip install -r requirements.txt` (or `pip install flask flask-cors PyPDF2 pandas`)
3. `python app.py`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm start`

## Deployment Steps

### 1. Build the React frontend
```sh
cd frontend
npm install
npm run build
```
This creates a `frontend/build/` directory with static files.

### 2. Serve the React build with Flask (production)
- Copy the contents of `frontend/build/` into a new folder, e.g. `backend/static/`.
- In `backend/app.py`, add a route to serve the frontend:

```python
from flask import send_from_directory
# ...existing code...
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    else:
        return send_from_directory('static', 'index.html')
```
- Make sure your Flask app is started from the `backend/` directory and the static files are in `backend/static/`.

### 3. Run Flask in production mode
- Use a WSGI server like Gunicorn or Waitress for production:
```sh
pip install gunicorn
cd backend
export FLASK_APP=app:app
export FLASK_ENV=production
# For Linux/macOS:
gunicorn -b 0.0.0.0:5050 app:app
# For Windows, use waitress-serve
```

### 4. (Optional) Use a reverse proxy (Nginx/Apache) for HTTPS and static files
- Point your reverse proxy to the Flask server on port 5050.

---

## Features
- List PDF templates and matching CSVs
- Preview blank and filled PDFs
- Download filled PDFs
- Robust checkbox support (works for any export value)
- (Bonus) Upload new templates/CSVs, validation, session logs

## Sample Data
- Place a sample PDF in `backend/templates/`
- Place a matching CSV in `backend/data/` (filename must start with template name)

---

See backend/README.md for API details.
