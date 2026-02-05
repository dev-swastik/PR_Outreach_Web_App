import { useState, useEffect } from 'react';
import { Upload, Filter, Trash2, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import './EmailLists.css';

export default function EmailLists() {
  const [lists, setLists] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

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

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const text = await file.text();
      const rows = text.split('\n').filter(row => row.trim());
      const journalistsData = rows.slice(1).map(row => {
        const [email, firstName, lastName, publication] = row.split(',').map(s => s.trim());
        return { email, firstName, lastName, publication };
      }).filter(j => j.email);

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          company: file.name.replace('.csv', ''),
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
              subject: '',
              body: '',
              status: 'draft',
            });
        }
      }

      await loadCampaigns();
    } catch (error) {
      console.error('Failed to upload file:', error);
      alert('Failed to upload file: ' + error.message);
    } finally {
      setUploading(false);
    }
  }

  const filteredLists = lists.filter(list => {
    if (filterStatus === 'all') return true;
    return list.status.toLowerCase() === filterStatus;
  });

  return (
    <div className="email-lists">
      <div className="page-header">
        <h1>Email Campaigns</h1>
        <p>Manage scraped and uploaded email Campaigns</p>
      </div>

      <div className="lists-toolbar">
        <label className="upload-btn">
          <Upload size={18} />
          Upload CSV
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

      <div className="lists-table">
        <div className="table-header">
          <div>List Name</div>
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
            <div key={list.id} className="table-row">
              <div><strong>{list.name}</strong></div>
              <div>{list.count}</div>
              <div className="unsubscribed">{list.unsubscribed}</div>
              <div className="blocked">{list.blocked}</div>
              <div><span className={`badge status-${list.status.toLowerCase()}`}>{list.status}</span></div>
              <div className="actions">
                <button title="Download"><Download size={18} /></button>
                <button title="Delete"><Trash2 size={18} /></button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
