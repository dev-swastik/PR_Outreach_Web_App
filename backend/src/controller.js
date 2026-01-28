import { generatePersonalizedEmail } from "./ai.service.js";
import {
  upsertJournalist,
  createCampaign,
  createEmailRecord,
  updateCampaignStats
} from "./supabase.js";
import { rateLimiter } from "./rateLimiter.service.js";

export const startCampaign = async (req, res) => {
  const {
    company,
    topic,
    senderName = "PR Team",
    senderTitle = "Communications"
  } = req.body;

  try {
    // Fetch journalists from scraper service
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

    // Create campaign
    const campaign = await createCampaign(company, topic);
    let queuedCount = 0;

    // Process journalists
    for (const j of journalists) {
      const journalist = await upsertJournalist(j);
      const article = journalist.recent_articles?.[0];

      const emailBody = await generatePersonalizedEmail({
        journalistName:
          `${journalist.first_name} ${journalist.last_name}`.trim() || "there",
        publication: journalist.publication_name || "your publication",
        articleTitle: article?.title || "your recent article",
        topic,
        company,
        senderName,
        senderTitle
      });

      const email = await createEmailRecord(
        campaign.id,
        journalist.id,
        `Story idea: ${topic}`,
        emailBody
      );

      await rateLimiter.queueEmail({
        to: journalist.email,
        subject: `Story idea: ${topic}`,
        html: emailBody,
        emailId: email.id,
        campaignId: campaign.id
      });

      queuedCount++;
    }

    // Update campaign stats
    await updateCampaignStats(campaign.id, {
      total_emails: queuedCount,
      sent_count: queuedCount
    });

    res.json({
      success: true,
      campaignId: campaign.id,
      queued: queuedCount
    });

  } catch (err) {
    console.error("Campaign start failed:", err);
    res.status(500).json({ error: err.message });
  }
};
