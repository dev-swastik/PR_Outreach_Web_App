import { useState } from 'react';
import { Play, AlertCircle, Loader, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import './CampaignScraper.css';

export default function CampaignScraper() {
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('Email Outreach');
  const [topic, setTopic] = useState('');
  const [geography, setGeography] = useState('');
  const [scraping, setScraping] = useState(false);
  const [campaignCreated, setCampaignCreated] = useState(null);
  const [error, setError] = useState(null);

  async function handleRunScraper() {
    setError(null);
    setScraping(true);
    setCampaignCreated(null);

    try {
      if (!campaignName.trim() || !topic.trim()) {
        throw new Error('Campaign name and topic are required');
      }

      // Call backend to start campaign (scrapes, generates emails, queues for sending)
      const response = await api.startCampaign(campaignName, topic);

      if (response.success) {
        setCampaignCreated({
          id: response.campaignId,
          emailsQueued: response.queued,
          name: campaignName,
          topic: topic
        });
      } else {
        throw new Error('Campaign creation failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setScraping(false);
    }
  }

  return (
    <div className="campaign-scraper">
      <div className="page-header">
        <h1>Campaign & Scraper</h1>
        <p>Create campaigns and scrape journalist contacts</p>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {campaignCreated && (
        <div className="success-banner" style={{ backgroundColor: '#10b981', color: 'white', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CheckCircle size={24} />
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Campaign Created Successfully!</div>
            <div>{campaignCreated.emailsQueued} emails have been generated and queued for sending. View progress in Email Tracking.</div>
          </div>
        </div>
      )}

      <div className="scraper-container">
        <div className="setup-section">
          <h2>Campaign Setup</h2>

          <div className="form-group">
            <label htmlFor="campaignName">Campaign Name *</label>
            <input
              id="campaignName"
              type="text"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              placeholder="e.g., Q1 EdTech Outreach"
              disabled={scraping}
            />
          </div>

          <div className="form-group">
            <label htmlFor="campaignType">Campaign Type</label>
            <select
              id="campaignType"
              value={campaignType}
              onChange={e => setCampaignType(e.target.value)}
              disabled={scraping}
            >
              <option>PR Outreach</option>
              <option>Newsletter</option>
              <option>Client Update</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="topic">Topic(s) *</label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g., AI in Education, EdTech, AI Teaching Tools"
              disabled={scraping}
            />
          </div>

          <div className="form-group">
            <label htmlFor="geography">Target Geography (optional)</label>
            <input
              id="geography"
              type="text"
              value={geography}
              onChange={e => setGeography(e.target.value)}
              placeholder="e.g., US, Europe, Global"
              disabled={scraping}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleRunScraper}
            disabled={scraping}
          >
            {scraping ? (
              <>
                <Loader size={18} className="spinner" />
                Scraping...
              </>
            ) : (
              <>
                <Play size={18} />
                Run Scraper
              </>
            )}
          </button>
        </div>

        {campaignCreated && (
          <div className="results-section">
            <h2>Next Steps</h2>
            <p style={{ marginTop: '12px', color: '#666' }}>
              Go to the <strong>Email Tracking</strong> tab in the sidebar to monitor your campaign progress.
            </p>
            <div style={{ marginTop: '20px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setCampaignCreated(null);
                  setCampaignName('');
                  setTopic('');
                  setGeography('');
                }}
              >
                Create Another Campaign
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
