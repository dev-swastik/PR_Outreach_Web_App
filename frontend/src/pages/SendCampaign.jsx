import { useState, useEffect } from 'react';
import { Play, Pause, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import './SendCampaign.css';

export default function SendCampaign() {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [sendingSpeed, setSendingSpeed] = useState('Medium');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    loadCampaigns();
  }, []);

  async function loadCampaigns() {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    }
  }

  async function handleStartSending() {
    setSending(true);
    try {
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Initialize progress
      setProgress({
        sent: campaign.sent_count || 0,
        total: campaign.total_emails || 0,
        remaining: (campaign.total_emails || 0) - (campaign.sent_count || 0)
      });

      // Start sending the campaign emails
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/send-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: selectedCampaign })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start campaign');
      }

      const result = await response.json();
      console.log('Campaign started:', result);

      // Poll for updates to show progress
      const pollInterval = setInterval(async () => {
        const updated = await supabase
          .from('campaigns')
          .select('*')
          .eq('id', selectedCampaign)
          .single();

        if (updated.data) {
          setProgress({
            sent: updated.data.sent_count || 0,
            total: updated.data.total_emails || 0,
            remaining: (updated.data.total_emails || 0) - (updated.data.sent_count || 0),
          });

          // Stop polling when all emails are sent
          if (updated.data.sent_count >= updated.data.total_emails) {
            clearInterval(pollInterval);
            setSending(false);
            await loadCampaigns();
          }
        }
      }, 3000); // Poll every 3 seconds

      // Safety timeout after 10 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setSending(false);
      }, 600000);

    } catch (error) {
      console.error('Failed to start campaign:', error);
      alert(error.message || 'Failed to start campaign sending');
      setSending(false);
    }
  }

  return (
    <div className="send-campaign">
      <div className="page-header">
        <h1>Send Email Campaign</h1>
        <p>Control email sending with intelligent rate limiting</p>
      </div>

      <div className="send-container">
        <div className="config-section">
          <h2>Campaign Settings</h2>

          <div className="form-group">
            <label htmlFor="campaign">Select Campaign</label>
            <select
              id="campaign"
              value={selectedCampaign}
              onChange={e => setSelectedCampaign(e.target.value)}
              disabled={sending}
            >
              <option value="">-- Choose a campaign --</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.company} - {campaign.topic} ({campaign.total_emails || 0} contacts)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="emailAccount">Email Account</label>
            <div className="email-account">
              <span className="verified-badge">✓ Verified</span>
              <span>campaigns@dumroo.ai</span>
            </div>
          </div>

          <div className="form-group">
            <label>Sending Speed</label>
            <div className="speed-options">
              <button
                className={`speed-btn ${sendingSpeed === 'Slow' ? 'active' : ''}`}
                onClick={() => setSendingSpeed('Slow')}
                disabled={sending}
              >
                <div className="speed-label">Slow</div>
                <small>Safe (60s apart)</small>
              </button>
              <button
                className={`speed-btn ${sendingSpeed === 'Medium' ? 'active' : ''}`}
                onClick={() => setSendingSpeed('Medium')}
                disabled={sending}
              >
                <div className="speed-label">Medium</div>
                <small>Standard (30s apart)</small>
              </button>
              <button
                className={`speed-btn ${sendingSpeed === 'Fast' ? 'active' : ''}`}
                onClick={() => setSendingSpeed('Fast')}
                disabled={sending}
              >
                <div className="speed-label">Fast</div>
                <small>Quick (5s apart)</small>
              </button>
            </div>
          </div>

          {sendingSpeed === 'Fast' && (
            <div className="warning-banner">
              <AlertCircle size={20} />
              <span>Fast sending may impact deliverability. Use with caution.</span>
            </div>
          )}

          <div className="action-buttons">
            <button
              className="btn btn-primary"
              onClick={handleStartSending}
              disabled={!selectedCampaign || sending}
            >
              <Play size={18} />
              Start Campaign
            </button>
            <button className="btn btn-secondary" disabled={!sending}>
              <Pause size={18} />
              Pause
            </button>
          </div>
        </div>

        {progress && (
          <div className="progress-section">
            <h2>Send Progress</h2>

            <div className="progress-stats">
              <div className="stat">
                <div className="stat-label">Sent</div>
                <div className="stat-value">{progress.sent}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Remaining</div>
                <div className="stat-value">{progress.remaining}</div>
              </div>
              <div className="stat">
                <div className="stat-label">Total</div>
                <div className="stat-value">{progress.total}</div>
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(progress.sent / progress.total) * 100}%` }}
              ></div>
            </div>

            <div className="progress-info">
              {((progress.sent / progress.total) * 100).toFixed(1)}% Complete
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
