import { getSupabaseClient } from './supabase.js';

/**
 * Track email open via tracking pixel
 */
export async function trackEmailOpen(req, res) {
  const { emailId } = req.params;
  const supabase = getSupabaseClient();

  try {
    const { data: email } = await supabase
      .from('emails')
      .select('id, campaign_id, opened_at')
      .eq('id', emailId)
      .maybeSingle();

    if (email && !email.opened_at) {
      await supabase
        .from('emails')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('id', emailId);

      if (email.campaign_id) {
        await supabase.rpc('increment_campaign_counter', {
          campaign_id: email.campaign_id,
          field_name: 'opened_count'
        });
      }
    }
  } catch (err) {
    console.error('Open tracking error:', err);
  }

  sendTrackingPixel(res);
}

/**
 * Track email link click
 */
export async function trackEmailClick(req, res) {
  const { emailId } = req.params;
  const { url } = req.query;
  const supabase = getSupabaseClient();

  try {
    const { data: email } = await supabase
      .from('emails')
      .select('id, campaign_id, clicked_at')
      .eq('id', emailId)
      .maybeSingle();

    if (email && !email.clicked_at) {
      await supabase
        .from('emails')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString()
        })
        .eq('id', emailId);

      if (email.campaign_id) {
        await supabase.rpc('increment_campaign_counter', {
          campaign_id: email.campaign_id,
          field_name: 'clicked_count'
        });
      }
    }
  } catch (err) {
    console.error('Click tracking error:', err);
  }

  res.redirect(url || 'https://example.com');
}

/**
 * Handle Resend webhooks (DELIVERED / BOUNCED / BLOCKED)
 */
export async function handleResendWebhook(req, res) {
  const supabase = getSupabaseClient();
  const event = req.body;

  try {
    const emailData = event.data;

    const { data: email } = await supabase
      .from('emails')
      .select('*')
      .eq('resend_email_id', emailData.email_id)
      .maybeSingle();

    if (!email) {
      return res.status(404).json({ error: 'Email not found' });
    }

    const updates = {};
    let campaignField = null;

    switch (event.type) {
      case 'email.delivered':
        updates.status = 'delivered';
        updates.delivered_at = new Date().toISOString();
        campaignField = 'sent_count';
        break;

      case 'email.bounced':
      case 'email.delivery_delayed': {
        const reason = emailData.bounce?.message?.toLowerCase() || '';

        const isBlocked =
          reason.includes('block') ||
          reason.includes('policy') ||
          reason.includes('spam');

        if (isBlocked) {
          updates.status = 'blocked';
          updates.blocked_at = new Date().toISOString();
          updates.error_message = emailData.bounce?.message || 'Email blocked';
          campaignField = 'blocked_count';
        } else {
          updates.status = 'bounced';
          updates.bounced_at = new Date().toISOString();
          updates.error_message = emailData.bounce?.message || 'Email bounced';
          campaignField = 'bounced_count';
        }
        break;
      }

      case 'email.complained':
        updates.status = 'blocked';
        updates.error_message = 'Spam complaint';
        campaignField = 'blocked_count';
        break;
    }

    if (Object.keys(updates).length) {
      await supabase
        .from('emails')
        .update(updates)
        .eq('id', email.id);
    }

    if (campaignField && email.campaign_id) {
      await supabase.rpc('increment_campaign_counter', {
        campaign_id: email.campaign_id,
        field_name: campaignField
      });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Unsubscribe option
 */
 export async function unsubscribe(req, res) {
  const { emailId } = req.params;
  const supabase = getSupabaseClient();

  try {
    // Find the email → journalist
    const { data: email, error } = await supabase
      .from("emails")
      .select("journalist_id")
      .eq("id", emailId)
      .single();

    if (error || !email) {
      return res.status(404).send("Invalid unsubscribe link");
    }

    // Mark journalist as unsubscribed
    await supabase
      .from("journalists")
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString()
      })
      .eq("id", email.journalist_id);

    res.send(`
      <h2>You’re unsubscribed</h2>
      <p>You will no longer receive emails from us.</p>
    `);

  } catch (err) {
    console.error("Unsubscribe error:", err);
    res.status(500).send("Something went wrong");
  }
}


/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(req, res) {
  const supabase = getSupabaseClient();
  const { campaignId } = req.params;

  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();

  const { data: emails } = await supabase
    .from('emails')
    .select(`
      id,
      status,
      journalist:journalists(first_name, last_name, email, publication_name)
    `)
    .eq('campaign_id', campaignId);

  const sent = campaign.sent_count || 0;

  res.json({
    campaign,
    totals: {
      total: campaign.total_emails,
      sent,
      delivered: sent - (campaign.bounced_count || 0) - (campaign.blocked_count || 0),
      opened: campaign.opened_count || 0,
      clicked: campaign.clicked_count || 0,
      bounced: campaign.bounced_count || 0,
      blocked: campaign.blocked_count || 0
    },
    rates: {
      openRate: sent ? ((campaign.opened_count || 0) / sent * 100).toFixed(2) : 0,
      clickRate: sent ? ((campaign.clicked_count || 0) / sent * 100).toFixed(2) : 0,
      bounceRate: sent ? ((campaign.bounced_count || 0) / sent * 100).toFixed(2) : 0,
      blockedRate: sent ? ((campaign.blocked_count || 0) / sent * 100).toFixed(2) : 0
    },
    emails
  });
}

function sendTrackingPixel(res) {
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Cache-Control': 'no-store'
  });

  res.end(pixel);
}
