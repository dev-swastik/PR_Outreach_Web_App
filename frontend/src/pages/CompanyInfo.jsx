import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './CompanyInfo.css';

const BRAND_TONES = ['Professional', 'Friendly', 'Informative', 'Persuasive'];
const DEFAULT_TOPICS = ['AI', 'EdTech', 'Education', 'SaaS', 'Healthcare', 'FinTech', 'Climate'];

export default function CompanyInfo() {
  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    website: '',
    industry: '',
    targetTopics: [],
    brandTone: 'Professional',
  });
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCompanyInfo();
  }, []);

  async function loadCompanyInfo() {
    try {
      const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCompanyId(data.id);
        setFormData({
          companyName: data.company_name || '',
          description: data.description || '',
          website: data.website || '',
          industry: data.industry || '',
          targetTopics: data.target_topics || [],
          brandTone: data.brand_tone || 'Professional',
        });
      }
    } catch (error) {
      console.error('Failed to load company info:', error);
    }
  }

  function handleInputChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  }

  function handleTopicToggle(topic) {
    setFormData(prev => ({
      ...prev,
      targetTopics: prev.targetTopics.includes(topic)
        ? prev.targetTopics.filter(t => t !== topic)
        : [...prev.targetTopics, topic],
    }));
    setSaved(false);
  }

  async function handleSave() {
    setLoading(true);
    setError(null);

    try {
      if (!formData.companyName.trim()) {
        throw new Error('Company name is required');
      }

      const payload = {
        company_name: formData.companyName,
        description: formData.description,
        website: formData.website,
        industry: formData.industry,
        target_topics: formData.targetTopics,
        brand_tone: formData.brandTone,
        updated_at: new Date().toISOString(),
      };

      if (companyId) {
        const { error } = await supabase
          .from('company_info')
          .update(payload)
          .eq('id', companyId);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('company_info')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        if (data) setCompanyId(data.id);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="company-info">
      <div className="page-header">
        <h1>Company Information</h1>
        <p>Configure your company context for email personalization and AI prompts</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {saved && (
        <div className="success-banner">
          <CheckCircle2 size={20} />
          <span>Company information saved successfully</span>
        </div>
      )}

      <div className="form-container">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="companyName">Company Name *</label>
            <input
              id="companyName"
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleInputChange}
              placeholder="e.g., Acme Corp"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="website">Website URL</label>
            <input
              id="website"
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              placeholder="https://example.com"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="industry">Industry / Category</label>
            <input
              id="industry"
              type="text"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Education"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Company Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief overview of your company and what you do..."
              rows="5"
              disabled={loading}
            />
            <small>{formData.description.length}/500 characters</small>
          </div>
        </div>

        <div className="form-section">
          <h2>Brand Configuration</h2>

          <div className="form-group">
            <label htmlFor="brandTone">Brand Tone</label>
            <select
              id="brandTone"
              name="brandTone"
              value={formData.brandTone}
              onChange={handleInputChange}
              disabled={loading}
            >
              {BRAND_TONES.map(tone => (
                <option key={tone} value={tone}>
                  {tone}
                </option>
              ))}
            </select>
            <small>Used to guide AI email generation</small>
          </div>

          <div className="form-group">
            <label>Target Topics</label>
            <div className="tags-grid">
              {DEFAULT_TOPICS.map(topic => (
                <button
                  key={topic}
                  className={`topic-tag ${formData.targetTopics.includes(topic) ? 'active' : ''}`}
                  onClick={() => handleTopicToggle(topic)}
                  disabled={loading}
                >
                  {topic}
                </button>
              ))}
            </div>
            <small>These help with journalist targeting and context</small>
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={loading || saved}
        >
          {loading ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
          {(loading || saved) && <span className={loading ? 'spinner' : 'checkmark'}>•</span>}
        </button>
      </div>
    </div>
  );
}
