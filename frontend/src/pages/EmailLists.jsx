import { useState, useEffect } from 'react';
import { Upload, Filter, Trash2, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './EmailLists.css';

export default function EmailLists() {
  const [lists, setLists] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const [journalists, setJournalists] = useState([]);

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

      const formattedLists = await Promise.all(data.map(async campaign => {
        const { count } = await supabase
          .from('emails')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaign.id);

        return {
          id: campaign.id,
          name: `${campaign.company} - ${campaign.topic}`,
          status: campaign.status || 'draft',
          count: count || 0,
          unsubscribed: campaign.unsubscribed_count || 0,
          blocked: campaign.blocked_count || 0,
        };
      }));

      setLists(formattedLists);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleCampaign(campaignId) {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
      setJournalists([]);
    } else {
      setExpandedCampaign(campaignId);
      await loadJournalists(campaignId);
    }
  }

  async function loadJournalists(campaignId) {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('journalist:journalists(*)')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      const journalistsList = data.map(item => item.journalist).filter(Boolean);
      setJournalists(journalistsList);
    } catch (error) {
      console.error('Failed to load journalists:', error);
      setJournalists([]);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());

      if (rows.length < 2) {
        throw new Error('CSV file must contain at least a header row and one data row');
      }

      const headers = rows[0].split(',').map(h => h.trim().toLowerCase());

      const emailIdx = headers.findIndex(h => h === 'email');
      const firstNameIdx = headers.findIndex(h => h === 'firstname' || h === 'first_name' || h === 'first name');
      const lastNameIdx = headers.findIndex(h => h === 'lastname' || h === 'last_name' || h === 'last name');
      const publicationIdx = headers.findIndex(h => h === 'publication');
      const subjectIdx = headers.findIndex(h => h === 'subject' || h === 'email_subject');
      const bodyIdx = headers.findIndex(h => h === 'body' || h === 'email_body' || h === 'message');

      if (emailIdx === -1) {
        throw new Error('CSV must contain an "email" column');
      }

      const journalistsData = rows.slice(1).map(row => {
        const cols = row.split(',').map(s => s.trim());
        return {
          email: cols[emailIdx],
          firstName: firstNameIdx >= 0 ? cols[firstNameIdx] : '',
          lastName: lastNameIdx >= 0 ? cols[lastNameIdx] : '',
          publication: publicationIdx >= 0 ? cols[publicationIdx] : '',
          subject: subjectIdx >= 0 ? cols[subjectIdx] : '',
          body: bodyIdx >= 0 ? cols[bodyIdx] : ''
        };
      }).filter(j => j.email);

      if (journalistsData.length === 0) {
        throw new Error('No valid email addresses found in CSV');
      }

      const campaignName = file.name.replace('.csv', '');

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          company: campaignName,
          topic: 'Uploaded List',
          status: 'draft',
          total_emails: journalistsData.length,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      for (const j of journalistsData) {
        const { data: journalist, error: journalistError } = await supabase
          .from('journalists')
          .upsert({
            email: j.email,
            first_name: j.firstName || '',
            last_name: j.lastName || '',
            publication_name: j.publication || '',
          }, { onConflict: 'email' })
          .select()
          .single();

        if (!journalistError && journalist) {
          await supabase
            .from('emails')
            .insert({
              campaign_id: campaign.id,
              journalist_id: journalist.id,
              subject: j.subject || `Outreach - ${campaignName}`,
              body: j.body || '',
              status: 'draft',
            });
        }
      }

      await loadCampaigns();
      alert(`Successfully uploaded ${journalistsData.length} contacts to campaign "${campaignName}"`);
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file: ' + error.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const filteredLists = lists.filter(list => {
    if (filterStatus === 'all') return true;
    return list.status.toLowerCase() === filterStatus;
  });

  return (
    <div className="Campaign-lists">
      <div className="page-header">
        <h1>Email Campaigns</h1>
        <p>Manage scraped and uploaded email Campaigns</p>
      </div>

      <div className="lists-toolbar">
        <label className="upload-btn">
          <Upload size={18} />
          {uploading ? 'Uploading...' : 'Upload CSV'}
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            hidden
          />
        </label>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div className="csv-format-info" style={{
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae6fd',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>CSV Format</h3>
        <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#475569' }}>
          Your CSV file must include an <strong>email</strong> column. Optional columns: first_name, last_name, publication, subject, body
        </p>
        <code style={{
          display: 'block',
          backgroundColor: '#e0f2fe',
          padding: '8px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          overflowX: 'auto'
        }}>
          email,first_name,last_name,publication,subject,body<br/>
          john@example.com,John,Doe,TechCrunch,Story Idea,Hi John...
        </code>
      </div>

      <div className="lists-table">
        <div className="table-header">
          <div>Campaign Name</div>
          <div>Contacts</div>
          <div>Unsubscribed</div>
          <div>Blocked</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div className="empty-state">
            <p>Loading...</p>
          </div>
        ) : filteredLists.length === 0 ? (
          <div className="empty-state">
            <p>No lists found. Upload or scrape contacts to get started.</p>
          </div>
        ) : (
          filteredLists.map(list => (
            <div key={list.id}>
              <div className="table-row clickable" onClick={() => toggleCampaign(list.id)}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {expandedCampaign === list.id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    <strong>{list.name}</strong>
                  </div>
                </div>
                <div>{list.count}</div>
                <div className="unsubscribed">{list.unsubscribed}</div>
                <div className="blocked">{list.blocked}</div>
                <div><span className={`badge status-${list.status.toLowerCase()}`}>{list.status}</span></div>
                <div className="actions" onClick={e => e.stopPropagation()}>
                  <button title="Download"><Download size={18} /></button>
                  <button title="Delete"><Trash2 size={18} /></button>
                </div>
              </div>

              {expandedCampaign === list.id && (
                <div className="journalists-list">
                  <h3>Journalists in this campaign ({journalists.length})</h3>
                  {journalists.length === 0 ? (
                    <p className="empty-message">No journalists found in this campaign.</p>
                  ) : (
                    <div className="journalists-table">
                      <div className="journalists-header">
                        <div>Name</div>
                        <div>Email</div>
                        <div>Publication</div>
                      </div>
                      {journalists.map((journalist, idx) => (
                        <div key={journalist.id || idx} className="journalist-row">
                          <div>{journalist.first_name} {journalist.last_name}</div>
                          <div className="email-cell">{journalist.email}</div>
                          <div>{journalist.publication_name || '-'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
