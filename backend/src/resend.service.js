import { Resend } from 'resend';
import { getSupabaseClient } from './supabase.js';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Send email via Resend with tracking
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML body
 * @param {string} emailId - Database email record ID
 * @returns {Promise<Object>} Resend response
 */
export async function sendEmailWithTracking(to, subject, html, emailId) {
  const supabase = getSupabaseClient();

  try {
    // Add tracking pixel and click tracking to email
    const trackingPixel = `<img src="${process.env.BACKEND_URL || 'http://localhost:5000'}/track/open/${emailId}" width="1" height="1" style="display:none" />`;
    const trackedHtml = html + trackingPixel;

    // Send email via Resend
    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL || 'onboarding@resend.dev',
      to: to,
      subject: subject,
      html: trackedHtml,
      tags: [
        { name: 'email_id', value: emailId }
      ]
    });

    // Update email record with Resend ID and sent status
    await supabase
      .from('emails')
      .update({
        resend_email_id: response.id,
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('id', emailId);

    return {
      success: true,
      resendId: response.id,
      emailId
    };

  } catch (error) {
    console.error('Failed to send email:', error);

    // Update email record with error
    await supabase
      .from('emails')
      .update({
        status: 'failed',
        error_message: error.message
      })
      .eq('id', emailId);

    return {
      success: false,
      error: error.message,
      emailId
    };
  }
}

/**
 * Process webhook events from Resend
 * Updates email tracking status based on events
 */
export async function handleResendWebhook(event) {
  const supabase = getSupabaseClient();

  const eventType = event.type;
  const emailData = event.data;
  const resendEmailId = emailData.email_id;

  // Find email record by Resend ID
  const { data: emailRecord, error } = await supabase
    .from('emails')
    .select('id, campaign_id')
    .eq('resend_email_id', resendEmailId)
    .maybeSingle();

  if (error || !emailRecord) {
    console.error('Email record not found for Resend ID:', resendEmailId);
    return;
  }

  const updates = { updated_at: new Date().toISOString() };
  let campaignUpdate = null;

  // Map Resend event types to our status tracking
  switch (eventType) {
    case 'email.delivered':
      updates.status = 'delivered';
      updates.delivered_at = new Date().toISOString();
      break;

    case 'email.opened':
      if (!emailRecord.opened_at) {
        updates.status = 'opened';
        updates.opened_at = new Date().toISOString();
        campaignUpdate = { opened_count: 1 };
      }
      break;

    case 'email.clicked':
      if (!emailRecord.clicked_at) {
        updates.status = 'clicked';
        updates.clicked_at = new Date().toISOString();
        campaignUpdate = { clicked_count: 1 };
      }
      break;

    case 'email.bounced':
    case 'email.delivery_delayed':
      updates.status = 'bounced';
      updates.bounced_at = new Date().toISOString();
      updates.error_message = emailData.bounce?.message || 'Email bounced';
      campaignUpdate = { bounced_count: 1 };
      break;

    case 'email.complained':
      updates.status = 'bounced';
      updates.error_message = 'Spam complaint received';
      break;

    default:
      console.log('Unhandled event type:', eventType);
  }

  // Update email record
  await supabase
    .from('emails')
    .update(updates)
    .eq('id', emailRecord.id);

  // Update campaign statistics if needed
  if (campaignUpdate && emailRecord.campaign_id) {
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', emailRecord.campaign_id)
      .single();

    if (campaign) {
      const updatedCampaign = {};
      for (const [key, increment] of Object.entries(campaignUpdate)) {
        updatedCampaign[key] = (campaign[key] || 0) + increment;
      }

      await supabase
        .from('campaigns')
        .update(updatedCampaign)
        .eq('id', emailRecord.campaign_id);
    }
  }
}

/**
 * Get email sending statistics for a campaign
 */
export async function getCampaignStats(campaignId) {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  if (error) {
    throw new Error('Campaign not found');
  }

  return {
    total: data.total_emails,
    sent: data.sent_count,
    delivered: data.sent_count - data.bounced_count,
    opened: data.opened_count,
    clicked: data.clicked_count,
    bounced: data.bounced_count,
    openRate: data.sent_count > 0 ? (data.opened_count / data.sent_count * 100).toFixed(2) : 0,
    clickRate: data.sent_count > 0 ? (data.clicked_count / data.sent_count * 100).toFixed(2) : 0,
    bounceRate: data.sent_count > 0 ? (data.bounced_count / data.sent_count * 100).toFixed(2) : 0
  };
}
