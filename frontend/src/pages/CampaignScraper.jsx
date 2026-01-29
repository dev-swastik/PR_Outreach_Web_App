import { useState } from 'react';
import { Play, AlertCircle, Loader } from 'lucide-react';
import './CampaignScraper.css';

export default function CampaignScraper() {
  const [campaignName, setCampaignName] = useState('');
  const [campaignType, setCampaignType] = useState('PR Outreach');
  const [topic, setTopic] = useState('');
  const [geography, setGeography] = useState('');
  const [scraping, setScraping] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [selectedContacts, setSelectedContacts] = useState(new Set());

  async function handleRunScraper() {
    setError(null);
    setScraping(true);

    try {
      if (!campaignName.trim() || !topic.trim()) {
        throw new Error('Campaign name and topic are required');
      }

      // TODO: Call backend scraper API
      // const data = await fetch('/api/scraper/run', {...})
      await new Promise(resolve => setTimeout(resolve, 2000));

      setResults([
        {
          id: '1',
          name: 'Jane Doe',
          email: 'jane@publication.com',
          publication: 'Tech News Daily',
          location: 'San Francisco, CA',
          topicMatch: 95,
          status: 'new',
        },
        {
          id: '2',
          name: 'John Smith',
          email: 'john@media.com',
          publication: 'Education Weekly',
          location: 'New York, NY',
          topicMatch: 88,
          status: 'new',
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setScraping(false);
    }
  }

  function toggleContactSelection(id) {
    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
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

        {results.length > 0 && (
          <div className="results-section">
            <h2>Scraped Contacts ({results.length})</h2>
            <div className="results-table">
              <div className="table-header">
                <input
                  type="checkbox"
                  onChange={e => {
                    if (e.target.checked) {
                      setSelectedContacts(new Set(results.map(r => r.id)));
                    } else {
                      setSelectedContacts(new Set());
                    }
                  }}
                  checked={selectedContacts.size === results.length && results.length > 0}
                />
                <div>Name</div>
                <div>Email</div>
                <div>Publication</div>
                <div>Topic Match</div>
                <div>Status</div>
              </div>
              {results.map(contact => (
                <div key={contact.id} className="table-row">
                  <input
                    type="checkbox"
                    checked={selectedContacts.has(contact.id)}
                    onChange={() => toggleContactSelection(contact.id)}
                  />
                  <div>{contact.name}</div>
                  <div>{contact.email}</div>
                  <div>{contact.publication}</div>
                  <div><span className="match-badge">{contact.topicMatch}%</span></div>
                  <div><span className="status-badge">{contact.status}</span></div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary">
              Save {selectedContacts.size || results.length} Contacts
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
