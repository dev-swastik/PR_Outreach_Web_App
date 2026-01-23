import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

/**
 * Get or create Supabase client instance
 * Uses service role key for backend operations
 */
export function getSupabaseClient() {
  if (!supabaseClient) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  return supabaseClient;
}

/**
 * Store or update journalist in database
 */
export async function upsertJournalist(journalistData) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('journalists')
    .upsert({
      email: journalistData.email,
      first_name: journalistData.first_name || '',
      last_name: journalistData.last_name || '',
      city: journalistData.city || '',
      state: journalistData.state || '',
      country: journalistData.country || '',
      publication_name: journalistData.publication_name || '',
      topics: journalistData.topics || [],
      recent_articles: journalistData.recent_articles || []
    }, {
      onConflict: 'email'
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting journalist:', error);
    throw error;
  }

  return data;
}

/**
 * Create a new campaign
 */
export async function createCampaign(company, topic) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      company,
      topic,
      status: 'running'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }

  return data;
}

/**
 * Create an email record
 */
export async function createEmailRecord(campaignId, journalistId, subject, body) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('emails')
    .insert({
      campaign_id: campaignId,
      journalist_id: journalistId,
      subject,
      body,
      status: 'queued'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating email record:', error);
    throw error;
  }

  return data;
}

/**
 * Get all emails for a campaign
 */
export async function getCampaignEmails(campaignId) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('emails')
    .select(`
      *,
      journalist:journalists(*)
    `)
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching campaign emails:', error);
    throw error;
  }

  return data;
}

/**
 * Update campaign statistics
 */
export async function updateCampaignStats(campaignId, updates) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('campaigns')
    .update(updates)
    .eq('id', campaignId)
    .select()
    .single();

  if (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }

  return data;
}
