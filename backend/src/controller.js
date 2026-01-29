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
import { findJournalistEmail } from "./enrichment/hunter.service.js";

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
        const emailData = await findJournalistEmail({
        firstName: j.first_name,
        lastName: j.last_name,
        domain: j.publication_domain
    });

    // Skip if no verified email
    if (!emailData?.email || emailData.confidence < 70) {
        console.log(
        `Skipping ${j.first_name} ${j.last_name} — no verified email`
        );
        continue;
    }

    // Store journalist WITH verified email
    const journalist = await upsertJournalist({
        ...j,
        email: emailData.email,
        email_confidence: emailData.confidence,
        email_source: emailData.source
    });

    const article = journalist.recent_articles?.[0];

    // Generate AI email
    const emailBody = await generatePersonalizedEmail({
        journalistName: `${journalist.first_name} ${journalist.last_name}`.trim(),
        publication: journalist.publication_name,
        articleTitle: article?.title,
        topic,
        company,
        senderName,
        senderTitle
    });

    // Create email DB record
    const email = await createEmailRecord(
        campaign.id,
        journalist.id,
        `Story idea: ${topic}`,
        emailBody
    );

    // Queue email
    await rateLimiter.queueEmail({
        to: journalist.email,
        subject: `Story idea: ${topic}`,
        html: emailBody,
        emailId: email.id,
        campaignId: campaign.id
    });
    queued++;
}


    await updateCampaignStats(campaign.id, {
      total_emails: queued,
      sent_count: queued
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

export const getRateLimiterStatus = (req, res) => {
  res.json(rateLimiter.getStatus());
};
