
import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import './App.css';

const TECH_BG = '#f8fafc';
const TECH_PANEL = '#ffffff';
const TECH_ACCENT = '#f1f5f9';
const TECH_BORDER = '#e2e8f0';
const TECH_TEXT = '#334155';
const TECH_MONO = 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
const TECH_BTN = '#3b82f6';
const TECH_BTN_DANGER = '#ef4444';
const TECH_BTN_TEXT = '#fff';

function DataManager() {
  const [csvs, setCsvs] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [log, setLog] = useState([]);

  useEffect(() => {
    // Try to fetch all CSVs in /data directory (new endpoint or fallback to list all .csv files)
    fetch('/data_list')
      .then(async res => {
        if (res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          setCsvs(data.csvs || []);
        } else {
          setCsvs([]);
        }
      })
      .catch(() => setCsvs([]));
  }, []);

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/upload_data', { method: 'POST', body: formData });
    let data = {};
    try {
      if (res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      } else {
        data = { error: await res.text() };
      }
    } catch {
      data = { error: 'Unknown error' };
    }
    setMessage(data.error || data.success || '');
    setLog(l => [...l, `[UPLOAD] ${file.name}: ${data.error || data.success || 'Unknown'}`]);
    if (res.ok) setCsvs(c => [...c, file.name]);
  };

  const handleDelete = async name => {
    if (!window.confirm(`Delete CSV ${name}?`)) return;
    const res = await fetch(`/delete_data?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
    let data = {};
    try {
      if (res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      } else {
        data = { error: await res.text() };
      }
    } catch {
      data = { error: 'Unknown error' };
    }
    setMessage(data.error || data.success || '');
    setLog(l => [...l, `[DELETE] ${name}: ${data.error || data.success || 'Unknown'}`]);
    if (res.ok) setCsvs(c => c.filter(f => f !== name));
  };

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', background: TECH_PANEL, borderRadius: 12, boxShadow: '0 4px 24px #0006', padding: 32, border: `1px solid ${TECH_BORDER}`, fontFamily: TECH_MONO }}>
      <h2 style={{ fontWeight: 800, fontSize: 24, color: TECH_TEXT, marginBottom: 18, letterSpacing: 1 }}>Data CSVs</h2>
      <form onSubmit={handleUpload} style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input type="file" accept=".csv" title="Upload CSV file" onChange={e => setFile(e.target.files[0])} style={{ color: TECH_TEXT, fontFamily: TECH_MONO, background: TECH_BG, border: `1px solid ${TECH_BORDER}`, borderRadius: 6, padding: 6, fontSize: 15, flex: 1 }} />
        <button type="submit" title="Upload selected CSV" style={{ padding: '8px 22px', borderRadius: 6, background: TECH_BTN, color: TECH_BTN_TEXT, fontWeight: 700, border: 'none', fontFamily: TECH_MONO, fontSize: 16, letterSpacing: 1, boxShadow: '0 2px 8px #0002', cursor: 'pointer', transition: 'background 0.2s' }}>Upload</button>
      </form>
      {message && <div style={{ color: message.includes('success') ? '#98c379' : TECH_BTN_DANGER, marginBottom: 14, fontFamily: TECH_MONO, fontWeight: 700 }}>{message}</div>}
      <h4 style={{ color: TECH_TEXT, fontFamily: TECH_MONO, fontWeight: 700, fontSize: 16, margin: '22px 0 10px 0' }}>Existing Data CSVs</h4>
      <ul style={{ listStyle: 'none', padding: 0, fontFamily: TECH_MONO, fontSize: 15 }}>
        {csvs.length === 0 && <li style={{ color: '#e06c75', fontWeight: 700, padding: '8px 0' }}>No CSV files found.</li>}
        {csvs.map(t => (
          <li key={t} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: TECH_ACCENT, borderRadius: 6, padding: '8px 14px', border: `1px solid ${TECH_BORDER}` }}>
            <span title={t} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{t}</span>
            <button title="Delete CSV" onClick={() => handleDelete(t)} style={{ background: TECH_BTN_DANGER, color: TECH_BTN_TEXT, border: 'none', borderRadius: 4, padding: '4px 14px', fontWeight: 700, fontFamily: TECH_MONO, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}>Delete</button>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 24, background: TECH_BG, color: TECH_TEXT, fontFamily: TECH_MONO, fontSize: 14, borderRadius: 6, border: `1px solid ${TECH_BORDER}`, padding: 12, minHeight: 48, boxShadow: '0 1px 4px #0002' }}>
        <b style={{ color: '#61afef', fontWeight: 700 }}>Log:</b>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
          {log.slice(-5).map((l, i) => <li key={i} style={{ color: '#abb2bf', fontWeight: 600 }}>{l}</li>)}
        </ul>
      </div>
      <Link to="/" style={{ display: 'inline-block', marginTop: 24, color: '#61afef', fontWeight: 700, fontFamily: TECH_MONO, fontSize: 16, textDecoration: 'none', borderRadius: 4, padding: '6px 18px', background: '#232946', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}>Back to Home</Link>
    </div>
  );
}

function TemplateManager() {
  const [templates, setTemplates] = useState([]);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/templates')
      .then(res => res.json())
      .then(data => setTemplates(data.templates || []));
  }, []);

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/upload_template', { method: 'POST', body: formData });
    let data = {};
    try {
      if (res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      } else {
        data = { error: await res.text() };
      }
    } catch {
      data = { error: 'Unknown error' };
    }
    setMessage(data.error || data.success || '');
    if (res.ok) setTemplates(t => [...t, file.name]);
  };

  const handleDelete = async name => {
    if (!window.confirm(`Delete template ${name}?`)) return;
    const res = await fetch(`/delete_template?name=${encodeURIComponent(name)}`, { method: 'DELETE' });
    let data = {};
    try {
      if (res.headers.get('content-type')?.includes('application/json')) {
        data = await res.json();
      } else {
        data = { error: await res.text() };
      }
    } catch {
      data = { error: 'Unknown error' };
    }
    setMessage(data.error || data.success || '');
    if (res.ok) setTemplates(t => t.filter(f => f !== name));
  };

  return (
    <div style={{ maxWidth: 540, margin: '0 auto', background: TECH_PANEL, borderRadius: 12, boxShadow: '0 4px 24px #0006', padding: 32, border: `1px solid ${TECH_BORDER}`, fontFamily: TECH_MONO }}>
      <h2 style={{ fontWeight: 800, fontSize: 24, color: TECH_TEXT, marginBottom: 18, letterSpacing: 1 }}>PDF Templates</h2>
      <form onSubmit={handleUpload} style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
        <input type="file" accept="application/pdf" title="Upload PDF template" onChange={e => setFile(e.target.files[0])} style={{ color: TECH_TEXT, fontFamily: TECH_MONO, background: TECH_BG, border: `1px solid ${TECH_BORDER}`, borderRadius: 6, padding: 6, fontSize: 15, flex: 1 }} />
        <button type="submit" title="Upload selected PDF" style={{ padding: '8px 22px', borderRadius: 6, background: TECH_BTN, color: TECH_BTN_TEXT, fontWeight: 700, border: 'none', fontFamily: TECH_MONO, fontSize: 16, letterSpacing: 1, boxShadow: '0 2px 8px #0002', cursor: 'pointer', transition: 'background 0.2s' }}>Upload</button>
      </form>
      {message && <div style={{ color: message.includes('success') ? '#98c379' : TECH_BTN_DANGER, marginBottom: 14, fontFamily: TECH_MONO, fontWeight: 700 }}>{message}</div>}
      <h4 style={{ color: TECH_TEXT, fontFamily: TECH_MONO, fontWeight: 700, fontSize: 16, margin: '22px 0 10px 0' }}>Existing Templates</h4>
      <ul style={{ listStyle: 'none', padding: 0, fontFamily: TECH_MONO, fontSize: 15 }}>
        {templates.length === 0 && <li style={{ color: '#e06c75', fontWeight: 700, padding: '8px 0' }}>No templates found.</li>}
        {templates.map(t => (
          <li key={t} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: TECH_ACCENT, borderRadius: 6, padding: '8px 14px', border: `1px solid ${TECH_BORDER}` }}>
            <span title={t} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 }}>{t}</span>
            <button title="Delete template" onClick={() => handleDelete(t)} style={{ background: TECH_BTN_DANGER, color: TECH_BTN_TEXT, border: 'none', borderRadius: 4, padding: '4px 14px', fontWeight: 700, fontFamily: TECH_MONO, fontSize: 15, cursor: 'pointer', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}>Delete</button>
          </li>
        ))}
      </ul>
      <Link to="/" style={{ display: 'inline-block', marginTop: 24, color: '#61afef', fontWeight: 700, fontFamily: TECH_MONO, fontSize: 16, textDecoration: 'none', borderRadius: 4, padding: '6px 18px', background: '#232946', boxShadow: '0 1px 4px #0002', transition: 'background 0.2s' }}>Back to Home</Link>
    </div>
  );
}

function App() {
  const [selectedRow, setSelectedRow] = useState(null);
  const [fillReady, setFillReady] = useState(false);
  const [filledPdfUrl, setFilledPdfUrl] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [fields, setFields] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [csvData, setCsvData] = useState([]);

  // Fetch templates on mount
  useEffect(() => {
    fetch('/templates')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch templates');
        const text = await res.text();
        if (!text) return setTemplates([]);
        try {
          const data = JSON.parse(text);
          setTemplates(data.templates || []);
        } catch {
          setTemplates([]);
        }
      })
      .catch(() => setTemplates([]));
  }, []);

  // Fetch PDF fields and CSV data when template changes
  useEffect(() => {
    if (selectedTemplate) {
      setPdfUrl(`/templates/${selectedTemplate}`);
      // Fetch PDF fields
      fetch(`/fields?template=${selectedTemplate}`)
        .then(async res => {
          if (!res.ok) throw new Error('Failed to fetch fields');
          const text = await res.text();
          if (!text) return setFields([]);
          try {
            const data = JSON.parse(text);
            setFields(data.fields || []);
          } catch {
            setFields([]);
          }
        })
        .catch(() => setFields([]));
      // Fetch CSV data
      fetch(`/datafile/${selectedTemplate.replace('.pdf', '.csv')}`)
        .then(async res => {
          if (!res.ok) return setCsvData([]);
          const text = await res.text();
          if (!text) return setCsvData([]);
          // Parse CSV
          const [header, ...rows] = text.trim().split(/\r?\n/);
          const columns = header.split(',');
          const dataRows = rows.map(r => {
            const values = r.split(',');
            const obj = {};
            columns.forEach((c, i) => obj[c] = values[i] || '');
            return obj;
          });
          setCsvData(dataRows);
        })
        .catch(() => setCsvData([]));
    } else {
      setCsvData([]);
    }
  }, [selectedTemplate]);



  return (
    <Router>
      <div className="App" style={{ display: 'flex', height: '100vh', fontFamily: 'Inter, Arial, sans-serif', background: '#f8fafc' }}>
        {/* Only show Upload New Template button on home page */}
        {window.location.pathname !== '/manage' && (
          <Link to="/manage" style={{ position: 'absolute', top: 24, right: 40, background: '#3b82f6', color: '#fff', padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 2px 8px #0002', zIndex: 10 }}>Upload New Template</Link>
        )}
        <Routes>
          <Route path="/manage" element={
            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: TECH_BG }}>
              <div style={{ display: 'flex', gap: 48, justifyContent: 'center', alignItems: 'flex-start', background: TECH_PANEL, borderRadius: 18, boxShadow: '0 8px 32px #0008', padding: 48, border: `2px solid ${TECH_BORDER}` }}>
                <TemplateManager />
                <DataManager />
              </div>
              {/* Persistent log panel at bottom */}
              <div style={{ position: 'fixed', left: 0, bottom: 0, width: '100vw', background: '#fff', color: '#334155', fontFamily: TECH_MONO, fontSize: 14, borderTop: `1px solid ${TECH_BORDER}`, padding: '10px 32px', zIndex: 100, boxShadow: '0 -1px 4px #0001', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 700, color: '#3b82f6' }}>Status:</span>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Manage your PDF templates and CSV data here. Upload, delete, and monitor recent actions in the log panels above.</span>
              </div>
            </div>
          } />
          <Route path="/" element={
            <>
              <aside style={{ width: 320, background: '#f1f5f9', color: '#334155', padding: 0, display: 'flex', flexDirection: 'column', boxShadow: '1px 0 4px #0001' }}>
                <div style={{ padding: '32px 24px 16px 24px', borderBottom: '1px solid #e2e8f0' }}>
                  <h2 style={{ margin: 0, fontWeight: 700, fontSize: 28, letterSpacing: 1, color: '#1e293b' }}>PDF Form Filler</h2>
                  <p style={{ margin: '8px 0 0 0', fontSize: 14, color: '#64748b' }}>Fill PDF forms using CSV data</p>
                </div>
                <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontWeight: 600, fontSize: 18 }}>Templates</h4>
                  <div style={{ marginBottom: 24 }}>
                    <select
                      value={selectedTemplate}
                      onChange={e => { setSelectedTemplate(e.target.value); setShowPreview(false); }}
                      style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #b8c1ec', fontSize: 16, background: '#fff', color: '#232946', fontWeight: 500 }}
                    >
                      <option value="">Select a template</option>
                      {templates.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  {selectedTemplate && (
                    <button
                      style={{ marginBottom: 16, padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                      onClick={async () => {
                        try {
                          // First verify the PDF exists and is accessible
                          const response = await fetch(`/templates/${selectedTemplate}`);
                          if (!response.ok) {
                            throw new Error('PDF not found');
                          }
                          const blob = await response.blob();
                          const url = URL.createObjectURL(blob);
                          setPdfUrl(url);
                          setFilledPdfUrl('');
                          setShowPreview(true);
                        } catch (error) {
                          alert('Unable to load PDF template. Please make sure the template exists.');
                        }
                      }}
                    >
                      See Preview
                    </button>
                  )}
                  {/* Removed Matching CSVs dropdown */}
                  {fields.length > 0 && (
                    <>
                      <h4 style={{ margin: '24px 0 8px 0', fontWeight: 600, fontSize: 18 }}>PDF Fields</h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {fields.map(f => (
                          <li key={f.name} style={{ marginBottom: 8, background: '#fff', color: '#232946', borderRadius: 6, padding: '8px 12px', fontSize: 15, boxShadow: '0 1px 4px #0001' }}>
                            <b>{f.name}</b> <span style={{ color: '#888', fontSize: 13 }}>({f['/FT'] || 'text'})</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div style={{ padding: 24, borderTop: '1px solid #2d3250', fontSize: 13, color: '#b8c1ec', textAlign: 'center' }}>
                  <span>Made with <span style={{ color: '#eebbc3' }}>♥</span> for PDF automation</span>
                </div>
              </aside>
              <main style={{ flex: 1, padding: 40, overflow: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: 900, margin: '0 auto' }}>
                  <h2 style={{ fontWeight: 700, fontSize: 26, color: '#232946', marginBottom: 16 }}>Template related data</h2>
                  {/* PDF preview removed from main page */}
                  {showPreview && (
                    <div style={{
                      position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} onClick={() => { 
                      setShowPreview(false);
                      // Don't revoke filledPdfUrl when closing preview, only revoke template preview URL
                      if (pdfUrl && !filledPdfUrl) {
                        URL.revokeObjectURL(pdfUrl);
                        setPdfUrl('');
                      }
                    }}>
                      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', padding: '48px 0 0 0', maxWidth: 1000, width: '90vw', height: '90vh', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => { 
                          setShowPreview(false);
                          // Don't revoke filledPdfUrl when closing preview, only revoke template preview URL
                          if (pdfUrl && !filledPdfUrl) {
                            URL.revokeObjectURL(pdfUrl);
                            setPdfUrl('');
                          }
                        }} style={{ position: 'absolute', top: 8, right: 8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 700, fontSize: 16, cursor: 'pointer', zIndex: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>Close</button>
                        <div style={{ width: '100%', height: 'calc(100% - 48px)', overflow: 'hidden', borderRadius: '0 0 12px 12px' }}>
                          <object
                            data={filledPdfUrl || pdfUrl}
                            type="application/pdf"
                            width="100%"
                            height="100%"
                            style={{ display: 'block' }}
                          >
                            <embed
                              src={filledPdfUrl || pdfUrl}
                              type="application/pdf"
                              width="100%"
                              height="100%"
                              style={{ display: 'block' }}
                            />
                          </object>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* CSV Data Table or No Data Message */}
                  {csvData.length > 0 ? (
                    <div style={{ margin: '24px 0' }}>
                      <h4 style={{ fontWeight: 600, fontSize: 18 }}>CSV Data</h4>
                      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 3px #0001' }}>
                        <thead>
                          <tr>
                            <th></th>
                            {Object.keys(csvData[0]).map(col => (
                              <th key={col} style={{ padding: 8, background: '#f8fafc', color: '#1e293b', fontWeight: 700, borderBottom: '2px solid #e2e8f0' }}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.map((row, idx) => (
                            <tr key={idx} style={{ background: selectedRow === idx ? '#f4f6fa' : '#fff' }}>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={selectedRow === idx}
                                  onChange={() => { setSelectedRow(idx); setFillReady(true); setFilledPdfUrl(''); }}
                                  disabled={selectedRow !== null && selectedRow !== idx}
                                />
                              </td>
                              {Object.values(row).map((val, i) => (
                                <td key={i} style={{ padding: 8 }}>{val}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ margin: '24px 0', color: '#d7263d', fontWeight: 600, fontSize: 18 }}>
                      No CSV data found
                    </div>
                  )}

                  {/* Fill PDF Button */}
                  {fillReady && (
                    <button
                      style={{ margin: '16px 0', padding: '10px 32px', background: '#232946', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 18, border: 'none', cursor: 'pointer' }}
                      onClick={async () => {
                        try {
                          const row = csvData[selectedRow];
                          // Create a temp CSV for this row
                          const csvHeader = Object.keys(row).join(',');
                          const csvRow = Object.values(row).join(',');
                          const blob = new Blob([csvHeader + '\n' + csvRow], { type: 'text/csv' });
                          // Upload temp CSV to backend/data (simulate by sending as file name)
                          const tempCsvName = 'temp_fill.csv';
                          // Call fill endpoint
                          const res = await fetch('/fill', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ template: selectedTemplate, csv: selectedTemplate.replace('.pdf', '.csv') })
                          });
                          if (!res.ok) {
                            throw new Error('Failed to fill PDF');
                          }
                          const pdfBlob = await res.blob();
                          // Clean up old URL if it exists
                          if (filledPdfUrl) {
                            URL.revokeObjectURL(filledPdfUrl);
                          }
                          const url = URL.createObjectURL(pdfBlob);
                          setFilledPdfUrl(url);
                          setShowPreview(true);
                        } catch (error) {
                          alert(error.message || 'Failed to fill PDF');
                        }
                      }}
                    >Fill PDF</button>
                  )}

                  {/* See Preview and Download */}
                  {filledPdfUrl && (
                    <div style={{ margin: '16px 0' }}>
                      <button
                        style={{ marginRight: 16, padding: '10px 22px', background: '#eebbc3', color: '#232946', borderRadius: 8, fontWeight: 700, fontSize: 16, border: 'none', cursor: 'pointer' }}
                        onClick={() => {
                          // Reset template preview URL if it exists
                          if (pdfUrl) {
                            URL.revokeObjectURL(pdfUrl);
                            setPdfUrl('');
                          }
                          setShowPreview(true);
                        }}
                      >See Preview</button>
                      <a
                        href={filledPdfUrl}
                        download={`filled_${selectedTemplate}`}
                        style={{ padding: '10px 22px', background: '#232946', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 16, textDecoration: 'none', boxShadow: '0 2px 8px #0001', transition: 'background 0.2s' }}
                      >Download PDF</a>
                    </div>
                  )}
                  {/* Removed Fill PDF, Preview, and Download logic */}
                </div>
              </main>
            </>
          } />
        </Routes>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </Router>
  );
}

export default App;
