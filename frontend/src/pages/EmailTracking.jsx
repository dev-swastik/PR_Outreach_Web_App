import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './EmailTracking.css';

export default function EmailTracking() {
  const [activeTab, setActiveTab] = useState('all');
  const [trackingData, setTrackingData] = useState({
    all: { count: 0, items: [] },
    queued: { count: 0, items: [] },
    delivered: { count: 0, items: [] },
    opened: { count: 0, items: [] },
    clicked: { count: 0, items: [] },
    bounced: { count: 0, items: [] },
    responses: { count: 0, items: [] },
    unsubscribed: { count: 0, items: [] },
  });
  const [kpis, setKpis] = useState([
    { label: 'Open Rate', value: '0%', color: 'blue' },
    { label: 'Click Rate', value: '0%', color: 'purple' },
    { label: 'Bounce Rate', value: '0%', color: 'red' },
  ]);

  useEffect(() => {
    loadTrackingData();
  }, []);

  async function loadTrackingData() {
    try {
      const { data: emails, error } = await supabase
        .from('emails')
        .select(`
          *,
          journalist:journalists(first_name, last_name, email, unsubscribed),
          campaign:campaigns(topic, company)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const emailsWithDetails = emails.map(email => ({
        ...email,
        journalist_name: email.journalist ? `${email.journalist.first_name} ${email.journalist.last_name}`.trim() : 'Unknown',
        journalist_email: email.journalist?.email || 'N/A',
        campaign_name: email.campaign?.company || 'N/A',
        is_unsubscribed: email.journalist?.unsubscribed || false
      }));

      const queued = emailsWithDetails.filter(e => e.status === 'queued');
      const delivered = emailsWithDetails.filter(e => e.status === 'sent' || e.status === 'delivered' || e.delivered_at);
      const opened = emailsWithDetails.filter(e => e.opened_at);
      const clicked = emailsWithDetails.filter(e => e.clicked_at);
      const bounced = emailsWithDetails.filter(e => e.bounced_at);
      const unsubscribed = emailsWithDetails.filter(e => e.is_unsubscribed === true);

      const totalDelivered = delivered.length;
      const openRate = totalDelivered > 0 ? ((opened.length / totalDelivered) * 100).toFixed(1) : '0';
      const clickRate = opened.length > 0 ? ((clicked.length / opened.length) * 100).toFixed(1) : '0';
      const bounceRate = emailsWithDetails.length > 0 ? ((bounced.length / emailsWithDetails.length) * 100).toFixed(1) : '0';

      setTrackingData({
        all: { count: emailsWithDetails.length, items: emailsWithDetails },
        queued: { count: queued.length, items: queued },
        delivered: { count: delivered.length, items: delivered },
        opened: { count: opened.length, items: opened },
        clicked: { count: clicked.length, items: clicked },
        bounced: { count: bounced.length, items: bounced },
        responses: { count: 0, items: [] },
        unsubscribed: { count: unsubscribed.length, items: unsubscribed },
      });

      setKpis([
        { label: 'Open Rate', value: `${openRate}%`, color: 'blue' },
        { label: 'Click Rate', value: `${clickRate}%`, color: 'purple' },
        { label: 'Bounce Rate', value: `${bounceRate}%`, color: 'red' },
      ]);
    } catch (error) {
      console.error('Failed to load tracking data:', error);
    }
  }

  return (
    <div className="email-tracking">
      <div className="page-header">
        <h1>Email Tracking Dashboard</h1>
        <p>Monitor campaign performance and email engagement</p>
      </div>

      <div className="kpi-grid">
        {kpis.map(kpi => (
          <div key={kpi.label} className={`kpi-card kpi-${kpi.color}`}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="tracking-tabs">
        {Object.entries(trackingData).map(([key, data]) => (
          <button
            key={key}
            className={`tab-btn ${activeTab === key ? 'active' : ''}`}
            onClick={() => setActiveTab(key)}
          >
            {key.charAt(0).toUpperCase() + key.slice(1)} ({data.count})
          </button>
        ))}
      </div>

      <div className="tracking-table">
        <div className="table-header">
          <div>Recipient</div>
          <div>Email</div>
          <div>Campaign</div>
          <div>Status</div>
          <div>Timestamp</div>
        </div>

        {trackingData[activeTab].items.length === 0 ? (
          <div className="empty-state">
            <p>No data available for this tracking status</p>
          </div>
        ) : (
          trackingData[activeTab].items.map((item, idx) => {
            let timestamp = item.sent_at || item.opened_at || item.clicked_at || item.bounced_at || item.created_at;
            return (
              <div key={idx} className="table-row">
                <div>{item.journalist_name}</div>
                <div>{item.journalist_email}</div>
                <div>{item.campaign_name}</div>
                <div><span className="status-badge">{item.status}</span></div>
                <div>{timestamp ? new Date(timestamp).toLocaleString() : 'N/A'}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
