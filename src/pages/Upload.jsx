import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, X, AlertCircle, Loader2 } from 'lucide-react';
import { extractTextFromFile } from '../lib/extractor';

export default function Upload() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const [title, setTitle] = useState('');

  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;
    
    // Check type
    const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    // Check size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setError('');
    setFile(selectedFile);
    setTitle(selectedFile.name.split('.')[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleProceed = async () => {
    if (!file) return;
    setIsLoading(true);
    setError('');
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 20) {
        setError('Could not extract enough text from this file. Please try another document.');
        setIsLoading(false);
        return;
      }
      navigate('/configure', { state: { title, extractedText: text } });
    } catch (err) {
      console.error('Extraction error details:', err);
      setError(`Could not read the file: ${err.message || 'Unknown error'}. Try re-saving as plain .txt, or use a different file.`);
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1 className="gradient-text" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Upload Document</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>
          Upload your PDF, DOCX, or TXT file and let AI generate the perfect quiz for you.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        {!file ? (
          <div 
            className={`file-upload-zone ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1.5rem', borderRadius: '50%', color: 'var(--primary)' }}>
                <UploadCloud size={48} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Drag & Drop your file here</h3>
                <p style={{ color: 'var(--text-muted)' }}>or</p>
              </div>
              <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
                Browse Files
                <input 
                  type="file" 
                  style={{ display: 'none' }} 
                  accept=".pdf,.docx,.txt"
                  onChange={handleChange}
                />
              </label>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '1rem' }}>
                Supported formats: PDF, DOCX, TXT. Max size: 10MB
              </p>
            </div>
          </div>
        ) : (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '1rem', background: 'rgba(16, 185, 129, 0.1)', padding: '1rem 2rem', borderRadius: 'var(--radius-lg)', color: 'var(--success)' }}>
              <File size={32} />
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>{file.name}</p>
                <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button 
                onClick={() => setFile(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', marginLeft: '1rem', padding: '0.5rem' }}
                title="Remove file"
              >
                <X size={24} />
              </button>
            </div>
            
            <div style={{ marginTop: '2rem' }}>
              <label className="input-label" style={{ textAlign: 'left' }}>Custom Document Name (Optional)</label>
              <input type="text" className="input-field" placeholder="E.g., Biology Chapter 4 Notes" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setFile(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleProceed} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                    Analyzing...
                  </>
                ) : (
                  'Next: Configure Quiz'
                )}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
