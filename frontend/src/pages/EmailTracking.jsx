import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './EmailTracking.css';

export default function EmailTracking() {
  const [activeTab, setActiveTab] = useState('delivered');
  const [trackingData, setTrackingData] = useState({
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
      const { data: trackingRecords, error } = await supabase
        .from('email_tracking')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const delivered = trackingRecords.filter(r => r.status === 'delivered' || r.status === 'sent');
      const opened = trackingRecords.filter(r => r.opened_at);
      const clicked = trackingRecords.filter(r => r.clicked_at);
      const bounced = trackingRecords.filter(r => r.status === 'bounced');
      const unsubscribed = trackingRecords.filter(r => r.unsubscribed);

      const totalDelivered = delivered.length;
      const openRate = totalDelivered > 0 ? ((opened.length / totalDelivered) * 100).toFixed(1) : '0';
      const clickRate = opened.length > 0 ? ((clicked.length / opened.length) * 100).toFixed(1) : '0';
      const bounceRate = trackingRecords.length > 0 ? ((bounced.length / trackingRecords.length) * 100).toFixed(1) : '0';

      setTrackingData({
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
          trackingData[activeTab].items.map((item, idx) => (
            <div key={idx} className="table-row">
              <div>{item.journalist_name || 'Unknown'}</div>
              <div>{item.journalist_email || 'N/A'}</div>
              <div>{item.campaign_id || 'N/A'}</div>
              <div><span className="status-badge">{item.status}</span></div>
              <div>{new Date(item.timestamp || item.created_at).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
