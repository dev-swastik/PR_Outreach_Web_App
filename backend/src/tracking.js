import { getSupabaseClient } from './supabase.js';

/**
 * Track email open via tracking pixel
 * Called when recipient loads the 1x1 transparent pixel
 */
export async function trackEmailOpen(req, res) {
  const { emailId } = req.params;
  const supabase = getSupabaseClient();

  try {
    // Get email record
    const { data: email, error } = await supabase
      .from('emails')
      .select('id, campaign_id, opened_at')
      .eq('id', emailId)
      .maybeSingle();

    if (error || !email) {
      console.error('Email not found for tracking:', emailId);
      return sendTrackingPixel(res);
    }

    // Only count first open
    if (!email.opened_at) {
      await supabase
        .from('emails')
        .update({
          status: 'opened',
          opened_at: new Date().toISOString()
        })
        .eq('id', emailId);

      // Update campaign stats
      if (email.campaign_id) {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('opened_count')
          .eq('id', email.campaign_id)
          .single();

        if (campaign) {
          await supabase
            .from('campaigns')
            .update({
              opened_count: (campaign.opened_count || 0) + 1
            })
            .eq('id', email.campaign_id);
        }
      }

      console.log(`Email opened: ${emailId}`);
    }

    sendTrackingPixel(res);

  } catch (error) {
    console.error('Error tracking email open:', error);
    sendTrackingPixel(res);
  }
}

/**
 * Track email link click
 * Wrap links in emails with this tracking URL
 */
export async function trackEmailClick(req, res) {
  const { emailId } = req.params;
  const { url } = req.query;
  const supabase = getSupabaseClient();

  try {
    // Get email record
    const { data: email, error } = await supabase
      .from('emails')
      .select('id, campaign_id, clicked_at')
      .eq('id', emailId)
      .maybeSingle();

    if (error || !email) {
      console.error('Email not found for click tracking:', emailId);
      return res.redirect(url || 'https://example.com');
    }

    // Only count first click
    if (!email.clicked_at) {
      await supabase
        .from('emails')
        .update({
          status: 'clicked',
          clicked_at: new Date().toISOString()
        })
        .eq('id', emailId);

      // Update campaign stats
      if (email.campaign_id) {
        const { data: campaign } = await supabase
          .from('campaigns')
          .select('clicked_count')
          .eq('id', email.campaign_id)
          .single();

        if (campaign) {
          await supabase
            .from('campaigns')
            .update({
              clicked_count: (campaign.clicked_count || 0) + 1
            })
            .eq('id', email.campaign_id);
        }
      }

      console.log(`Email link clicked: ${emailId}`);
    }

    // Redirect to actual URL
    res.redirect(url || 'https://example.com');

  } catch (error) {
    console.error('Error tracking click:', error);
    res.redirect(url || 'https://example.com');
  }
}

/**
 * Handle Resend webhook events
 * Resend will POST events to this endpoint for delivery, bounce, etc.
 */
export async function handleResendWebhook(req, res) {
  try {
    const event = req.body;

    console.log('Received Resend webhook:', event.type);

    const supabase = getSupabaseClient();
    const eventType = event.type;
    const emailData = event.data;

    // Find email by Resend ID
    const { data: email } = await supabase
      .from('emails')
      .select('id, campaign_id, delivered_at, bounced_at')
      .eq('resend_email_id', emailData.email_id)
      .maybeSingle();

    if (!email) {
      console.error('Email not found for Resend ID:', emailData.email_id);
      return res.status(404).json({ error: 'Email not found' });
    }

    const updates = {};
    let campaignIncrement = null;

    switch (eventType) {
      case 'email.delivered':
        updates.status = 'delivered';
        updates.delivered_at = new Date().toISOString();
        break;

      case 'email.bounced':
      case 'email.delivery_delayed':
        if (!email.bounced_at) {
          updates.status = 'bounced';
          updates.bounced_at = new Date().toISOString();
          updates.error_message = emailData.bounce?.message || 'Email bounced';
          campaignIncrement = { field: 'bounced_count', value: 1 };
        }
        break;

      case 'email.complained':
        updates.status = 'bounced';
        updates.error_message = 'Spam complaint received';
        break;

      default:
        console.log('Unhandled Resend event:', eventType);
    }

    // Update email record
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('emails')
        .update(updates)
        .eq('id', email.id);
    }

    // Update campaign stats
    if (campaignIncrement && email.campaign_id) {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select(campaignIncrement.field)
        .eq('id', email.campaign_id)
        .single();

      if (campaign) {
        await supabase
          .from('campaigns')
          .update({
            [campaignIncrement.field]: (campaign[campaignIncrement.field] || 0) + campaignIncrement.value
          })
          .eq('id', email.campaign_id);
      }
    }

    res.status(200).json({ success: true });

  } catch (error) {
    console.error('Error handling Resend webhook:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get campaign analytics
 */
export async function getCampaignAnalytics(req, res) {
  const { campaignId } = req.params;
  const supabase = getSupabaseClient();

  try {
    // Get campaign data
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Get all emails for detailed breakdown
    const { data: emails } = await supabase
      .from('emails')
      .select(`
        id,
        status,
        sent_at,
        delivered_at,
        opened_at,
        clicked_at,
        bounced_at,
        journalist:journalists(first_name, last_name, email, publication_name)
      `)
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    // Calculate rates
    const sentCount = campaign.sent_count || 0;
    const stats = {
      campaign: {
        id: campaign.id,
        company: campaign.company,
        topic: campaign.topic,
        status: campaign.status,
        created_at: campaign.created_at
      },
      totals: {
        total: campaign.total_emails,
        sent: sentCount,
        delivered: sentCount - (campaign.bounced_count || 0),
        opened: campaign.opened_count || 0,
        clicked: campaign.clicked_count || 0,
        bounced: campaign.bounced_count || 0
      },
      rates: {
        deliveryRate: sentCount > 0 ? ((sentCount - (campaign.bounced_count || 0)) / sentCount * 100).toFixed(2) : 0,
        openRate: sentCount > 0 ? ((campaign.opened_count || 0) / sentCount * 100).toFixed(2) : 0,
        clickRate: sentCount > 0 ? ((campaign.clicked_count || 0) / sentCount * 100).toFixed(2) : 0,
        bounceRate: sentCount > 0 ? ((campaign.bounced_count || 0) / sentCount * 100).toFixed(2) : 0
      },
      emails: emails || []
    };

    res.json(stats);

  } catch (error) {
    console.error('Error getting campaign analytics:', error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Send 1x1 transparent tracking pixel
 */
function sendTrackingPixel(res) {
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });

  res.end(pixel);
}
