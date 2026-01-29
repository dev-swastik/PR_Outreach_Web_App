import { useState } from 'react';
import { Wand2, Copy, Save } from 'lucide-react';
import { api } from '../lib/api';
import './EmailGeneration.css';

export default function EmailGeneration() {
  const [formData, setFormData] = useState({
    referenceContent: '',
    objective: 'Pitch article',
    tone: 'Professional',
    length: 'Medium',
  });
  const [preview, setPreview] = useState(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const response = await api.post('/generate-email', {
        referenceContent: formData.referenceContent,
        objective: formData.objective,
        tone: formData.tone,
        length: formData.length,
      });

      setPreview({
        subject: response.subject || 'Follow Up',
        body: response.body || 'Email content...',
      });
    } catch (error) {
      console.error('Failed to generate email:', error);
      alert('Failed to generate email');
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="email-generation">
      <div className="page-header">
        <h1>Generate Personalized Emails</h1>
        <p>Use AI to create targeted emails with context from company info</p>
      </div>

      <div className="generation-container">
        <div className="inputs-section">
          <h2>Email Configuration</h2>

          <div className="form-group">
            <label htmlFor="referenceContent">Reference Content</label>
            <textarea
              id="referenceContent"
              value={formData.referenceContent}
              onChange={e => setFormData({ ...formData, referenceContent: e.target.value })}
              placeholder="Paste article, press release, or blog link..."
              rows="6"
              disabled={generating}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="objective">Email Objective</label>
              <select
                id="objective"
                value={formData.objective}
                onChange={e => setFormData({ ...formData, objective: e.target.value })}
                disabled={generating}
              >
                <option>Pitch article</option>
                <option>Invite to collaborate</option>
                <option>Share product update</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="tone">Tone</label>
              <select
                id="tone"
                value={formData.tone}
                onChange={e => setFormData({ ...formData, tone: e.target.value })}
                disabled={generating}
              >
                <option>Professional</option>
                <option>Friendly</option>
                <option>Informative</option>
                <option>Persuasive</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="length">Length</label>
              <select
                id="length"
                value={formData.length}
                onChange={e => setFormData({ ...formData, length: e.target.value })}
                disabled={generating}
              >
                <option>Short</option>
                <option>Medium</option>
                <option>Long</option>
              </select>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generating...' : <><Wand2 size={18} /> Generate Email</>}
          </button>
        </div>

        {preview && (
          <div className="preview-section">
            <h2>Email Preview</h2>
            <div className="preview-card">
              <div className="preview-field">
                <label>Subject Line</label>
                <input type="text" value={preview.subject} readOnly className="subject-input" />
              </div>

              <div className="preview-field">
                <label>Email Body</label>
                <textarea value={preview.body} readOnly className="body-input" rows="8" />
              </div>

              <div className="preview-actions">
                <button className="btn btn-secondary">
                  <Copy size={16} /> Copy
                </button>
                <button className="btn btn-primary">
                  <Save size={16} /> Save Template
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
