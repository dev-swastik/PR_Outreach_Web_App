import { useState, useEffect } from 'react';
import { Wand2, Copy, Save, Send } from 'lucide-react';
import { api } from '../lib/api';
import { supabase } from '../lib/supabase';
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
  const [journalists, setJournalists] = useState([]);
  const [selectedJournalist, setSelectedJournalist] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadJournalists();
  }, []);

  async function loadJournalists() {
    try {
      const { data, error } = await supabase
        .from('journalists')
        .select('id, first_name, last_name, email, publication_name')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setJournalists(data || []);
    } catch (error) {
      console.error('Failed to load journalists:', error);
    }
  }

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

  async function handleSendEmail() {
    if (!selectedJournalist) {
      alert('Please select a journalist first');
      return;
    }

    if (!preview) {
      alert('Please generate an email first');
      return;
    }

    setSending(true);
    try {
      const journalist = journalists.find(j => j.id === selectedJournalist);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/send-single-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: journalist.email,
          subject: preview.subject,
          body: preview.body,
          journalistId: selectedJournalist,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email');
      }

      alert(`Email sent successfully to ${journalist.first_name} ${journalist.last_name}!`);
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleCopyToClipboard() {
    if (!preview) return;

    const emailContent = `Subject: ${preview.subject}\n\n${preview.body}`;
    navigator.clipboard.writeText(emailContent);
    alert('Email copied to clipboard!');
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
            <label htmlFor="journalist">Select Journalist</label>
            <select
              id="journalist"
              value={selectedJournalist}
              onChange={e => setSelectedJournalist(e.target.value)}
              disabled={generating || sending}
            >
              <option value="">Choose a journalist...</option>
              {journalists.map(journalist => (
                <option key={journalist.id} value={journalist.id}>
                  {journalist.first_name} {journalist.last_name} - {journalist.email}
                  {journalist.publication_name && ` (${journalist.publication_name})`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="referenceContent">Reference Content</label>
            <textarea
              id="referenceContent"
              value={formData.referenceContent}
              onChange={e => setFormData({ ...formData, referenceContent: e.target.value })}
              placeholder="Paste article, press release, or blog link..."
              rows="2"
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
                <button className="btn btn-secondary" onClick={handleCopyToClipboard}>
                  <Copy size={16} /> Copy
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSendEmail}
                  disabled={!selectedJournalist || sending}
                >
                  {sending ? 'Sending...' : <><Send size={16} /> Send Email</>}
                </button>
              </div>

              {selectedJournalist && (
                <div className="selected-recipient">
                  <strong>Recipient:</strong>{' '}
                  {journalists.find(j => j.id === selectedJournalist)?.first_name}{' '}
                  {journalists.find(j => j.id === selectedJournalist)?.last_name}{' '}
                  ({journalists.find(j => j.id === selectedJournalist)?.email})
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
