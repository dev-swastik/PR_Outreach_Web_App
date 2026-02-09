import fetch from "node-fetch";
import {
  upsertJournalist,
  createCampaign,
  createEmailRecord,
  updateCampaignStats,
  getCampaignEmails,
  getSupabaseClient
} from "./supabase.js";
import { generatePersonalizedEmail } from "./ai.service.js";
import { rateLimiter } from "./rateLimiter.service.js";

export const generateEmail = async (req, res) => {
  const { referenceContent, objective, tone, length, companyInfo } = req.body;

  try {
    const context = {
      referenceContent: referenceContent || '',
      objective: objective || 'Pitch article',
      tone: tone || 'Professional',
      length: length || 'Medium',
      companyInfo: companyInfo || {}
    };

    const prompt = `Generate a personalized email with the following context:
    Objective: ${context.objective}
    Tone: ${context.tone}
    Length: ${context.length}
    ${context.referenceContent ? `Reference Content: ${context.referenceContent}` : ''}
    ${context.companyInfo.company_name ? `Company: ${context.companyInfo.company_name}` : ''}
    ${context.companyInfo.description ? `About: ${context.companyInfo.description}` : ''}

Generate a professional email with a subject line and body.`;

    const email = await generatePersonalizedEmail({}, context.companyInfo, prompt);

    const subjectMatch = email.match(/Subject:\s*(.+)/);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Follow Up';
    const body = email.replace(/Subject:\s*.+\n\n?/, '').trim();

    res.json({ subject, body });
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).json({ error: error.message });
  }
};

export const startCampaign = async (req, res) => {
  const { company, topic, senderName = "PR Team", senderTitle = "Communications" } = req.body;

  try {
    if (!process.env.SCRAPER_SERVICE_URL) {
      throw new Error('SCRAPER_SERVICE_URL is not defined');
    }

    const supabase = getSupabaseClient();

    // Fetch actual company name from company_info table
    const { data: companyInfo, error: companyError } = await supabase
      .from('company_info')
      .select('company_name')
      .limit(1)
      .maybeSingle();

    if (companyError) {
      console.error("Error fetching company info:", companyError);
    }

    // Use company name from company_info if available, otherwise fall back to campaign name
    const actualCompanyName = companyInfo?.company_name || company;
    console.log("Using company name for emails:", actualCompanyName);

    const scraperRes = await fetch(
      `${process.env.SCRAPER_SERVICE_URL}/scrape?topic=${encodeURIComponent(topic)}`
    );

    if (!scraperRes.ok) {
      throw new Error("Failed to fetch journalists from scraper service");
    }

    const journalists = await scraperRes.json();
    if (!journalists.length) {
      return res.status(404).json({ error: "No journalists found" });
    }

    const campaign = await createCampaign(company, topic);

    let queued = 0;

    for (const j of journalists) {
    // Use email data from scraper service (already enriched)
    const journalistData = {
        ...j,
        email: j.email || null,
        email_confidence: j.email_confidence || 0,
        email_source: j.email_source || 'scraper'
    };

    // Always save the journalist to database
    const journalist = await upsertJournalist(journalistData);

    // Skip email generation if no verified email
    if (!journalist.email || journalist.email_confidence < 70) {
        console.log(
        ` Saved ${j.first_name} ${j.last_name} but skipping email (confidence: ${journalist.email_confidence}%)`
        );
        continue;
    }
    const article = journalist.recent_articles?.[0];

    // Generate AI email using actual company name from company_info
    const emailBody = await generatePersonalizedEmail({
        journalistName: `${journalist.first_name} ${journalist.last_name}`.trim(),
        publication: journalist.publication_name,
        articleTitle: article?.title,
        topic,
        company: actualCompanyName,
        senderName,
        senderTitle
    });

    // Create email DB record (but don't send yet)
    const email = await createEmailRecord(
        campaign.id,
        journalist.id,
        `Story idea: ${topic}`,
        emailBody
    );

    queued++;
}


    await updateCampaignStats(campaign.id, {
      total_emails: queued,
      sent_count: 0
    });

    res.json({
      success: true,
      campaignId: campaign.id,
      queued
    });

  } catch (error) {
    console.error("Campaign error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getCampaigns = async (req, res) => {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  res.json({ campaigns: data });
};

export const getCampaignDetails = async (req, res) => {
  const { campaignId } = req.params;
  const emails = await getCampaignEmails(campaignId);
  res.json({ emails });
};

export const sendCampaignEmails = async (req, res) => {
  const { campaignId } = req.body;

  try {
    const supabase = getSupabaseClient();

    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Prevent starting an already running campaign
    if (campaign.status === 'running') {
      return res.status(400).json({ error: 'Campaign is already running' });
    }

    // Get all queued emails for this campaign
    console.log(`[sendCampaignEmails] Looking for queued emails for campaign: ${campaignId}`);

    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('*, journalist:journalists(*)')
      .eq('campaign_id', campaignId)
      .eq('status', 'queued')
      .order('created_at', { ascending: true });

    if (emailsError) {
      console.error('[sendCampaignEmails] Error fetching emails:', emailsError);
      throw emailsError;
    }

    console.log(`[sendCampaignEmails] Found ${emails?.length || 0} queued emails`);

    if (!emails || emails.length === 0) {
      // Check if there are ANY emails for this campaign (debug info)
      const { data: allEmails } = await supabase
        .from('emails')
        .select('id, status')
        .eq('campaign_id', campaignId);

      console.log(`[sendCampaignEmails] Total emails in campaign: ${allEmails?.length || 0}`);
      if (allEmails && allEmails.length > 0) {
        console.log('[sendCampaignEmails] Email statuses:', allEmails.map(e => e.status));
      }

      return res.status(400).json({
        error: 'No queued emails found for this campaign',
        debug: {
          totalEmails: allEmails?.length || 0,
          statuses: allEmails?.map(e => e.status) || []
        }
      });
    }

    // Update campaign status to running
    await supabase
      .from('campaigns')
      .update({ status: 'running' })
      .eq('id', campaignId);

    // Queue all emails for sending
    let queuedCount = 0;
    for (const email of emails) {
      await rateLimiter.queueEmail({
        to: email.journalist.email,
        subject: email.subject,
        html: email.body,
        emailId: email.id,
        campaignId: campaign.id
      });
      queuedCount++;
    }

    res.json({
      success: true,
      queued: queuedCount,
      message: `${queuedCount} emails queued for sending`
    });

  } catch (error) {
    console.error('Error starting campaign send:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getRateLimiterStatus = (req, res) => {
  res.json(rateLimiter.getStatus());
};

export const previewEmail = async (req, res) => {
  const { emailId } = req.params;
  const supabase = getSupabaseClient();

  try {
    const { data: email, error } = await supabase
      .from("emails")
      .select("*, journalist:journalists(*)")
      .eq("id", emailId)
      .single();

    if (error || !email) {
      return res.status(404).send("<h1>Email not found</h1>");
    }

    res.setHeader("Content-Type", "text/html");
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Email Preview - ${email.subject}</title>
        <style>
          body { font-family: system-ui, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
          .preview-header { background: #1e40af; color: white; padding: 20px; }
          .preview-info { background: white; padding: 20px; margin: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .preview-info h3 { margin-top: 0; }
          .info-row { display: flex; gap: 10px; margin: 8px 0; }
          .info-label { font-weight: 600; min-width: 80px; }
          .email-content { background: white; padding: 40px; margin: 20px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .badge.dev { background: #fbbf24; color: #78350f; }
          .badge.sent { background: #10b981; color: white; }
        </style>
      </head>
      <body>
        <div class="preview-header">
          <h1>📧 Email Preview</h1>
          <p>This is how the email will appear to recipients</p>
        </div>

        <div class="preview-info">
          <h3>Email Details</h3>
          <div class="info-row">
            <span class="info-label">Status:</span>
            <span class="badge ${email.resend_email_id === 'dev-mode' ? 'dev' : 'sent'}">
              ${email.resend_email_id === 'dev-mode' ? 'DEV MODE' : email.status.toUpperCase()}
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">To:</span>
            <span>${email.journalist.first_name} ${email.journalist.last_name} &lt;${email.journalist.email}&gt;</span>
          </div>
          <div class="info-row">
            <span class="info-label">Subject:</span>
            <span>${email.subject}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email ID:</span>
            <span>${email.id}</span>
          </div>
        </div>

        <div class="email-content">
          ${email.body}
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Preview error:", error);
    res.status(500).send("<h1>Error loading preview</h1>");
  }
};
