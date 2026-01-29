import { useState, useEffect } from 'react';
import { Send, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './RespondResponses.css';

export default function RespondResponses() {
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [responses, setResponses] = useState([]);

  useEffect(() => {
    loadResponses();
  }, []);

  async function loadResponses() {
    try {
      const { data, error } = await supabase
        .from('email_tracking')
        .select('*')
        .eq('has_response', true)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const formattedResponses = (data || []).map(item => ({
        id: item.id,
        from: item.journalist_email || 'unknown@example.com',
        name: item.journalist_name || 'Unknown',
        subject: 'RE: Follow Up',
        message: item.response_text || 'No message content',
        timestamp: new Date(item.timestamp || item.created_at).toLocaleString(),
        campaign: item.campaign_id || 'Unknown Campaign',
        sentiment: 'Interested',
      }));

      setResponses(formattedResponses);
    } catch (error) {
      console.error('Failed to load responses:', error);
    }
  }

  return (
    <div className="respond-responses">
      <div className="page-header">
        <h1>Respond to Responses</h1>
        <p>Manage replies and continue conversations</p>
      </div>

      <div className="responses-container">
        <div className="responses-list">
          <h2>Inbox ({responses.length})</h2>
          {responses.map(response => (
            <div
              key={response.id}
              className={`response-item ${selectedResponse?.id === response.id ? 'selected' : ''}`}
              onClick={() => setSelectedResponse(response)}
            >
              <div className="response-header">
                <div className="response-sender">{response.name}</div>
                <span className={`sentiment-badge sentiment-${response.sentiment.toLowerCase().replace(' ', '-')}`}>
                  {response.sentiment}
                </span>
              </div>
              <div className="response-subject">{response.subject}</div>
              <div className="response-preview">{response.message.substring(0, 60)}...</div>
              <div className="response-time">{response.timestamp}</div>
            </div>
          ))}
        </div>

        {selectedResponse && (
          <div className="response-detail">
            <div className="detail-header">
              <div>
                <h3>{selectedResponse.name}</h3>
                <p>{selectedResponse.from}</p>
              </div>
              <div className="detail-meta">
                <small>{selectedResponse.campaign}</small>
                <span className={`sentiment-badge sentiment-${selectedResponse.sentiment.toLowerCase().replace(' ', '-')}`}>
                  {selectedResponse.sentiment}
                </span>
              </div>
            </div>

            <div className="email-thread">
              <div className="email-message">
                <div className="message-header">
                  <strong>{selectedResponse.name}</strong>
                  <small>{selectedResponse.timestamp}</small>
                </div>
                <div className="message-body">{selectedResponse.message}</div>
              </div>
            </div>

            <div className="reply-composer">
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                placeholder="Type your reply..."
                rows="5"
              />
              <div className="composer-actions">
                <button className="btn btn-secondary">
                  <Flag size={16} /> Mark Action
                </button>
                <button className="btn btn-primary">
                  <Send size={16} /> Send Reply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
