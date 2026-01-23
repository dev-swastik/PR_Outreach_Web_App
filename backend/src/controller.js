import { exec } from "child_process";
import { generatePersonalizedEmail } from "./ai.service.js";
import { upsertJournalist, createCampaign, createEmailRecord, updateCampaignStats } from "./supabase.js";
import { rateLimiter } from "./rateLimiter.service.js";
import path from "path";

export const startCampaign = async (req, res) => {
  const { company, topic, senderName = "PR Team", senderTitle = "Communications" } = req.body;

  try {
    // Find the scraper script path (relative to project root)
    const scraperPath = path.join(process.cwd(), "..", "scraper", "run_scraper.py");

    // Run scraper to find journalists
    console.log(`Starting campaign for topic: ${topic}`);
    exec(`python "${scraperPath}" "${topic}"`, async (err, stdout, stderr) => {
      if (err) {
        console.error("Scraper error:", err, stderr);
        return res.status(500).json({ error: "Failed to scrape journalists", details: err.message });
      }

      let scrapedJournalists;
      try {
        scrapedJournalists = JSON.parse(stdout);
      } catch (e) {
        console.error("Invalid scraper output:", stdout);
        return res.status(500).json({ error: "Invalid scraper output", details: stdout });
      }

      if (!scrapedJournalists || scrapedJournalists.length === 0) {
        return res.status(404).json({ error: "No journalists found for this topic" });
      }

      try {
        // Create campaign in database
        const campaign = await createCampaign(company, topic);
        console.log(`Campaign created with ID: ${campaign.id}`);

        const emailsQueued = [];

        // Process each journalist
        for (const journalistData of scrapedJournalists) {
          // Store journalist in database
          const journalist = await upsertJournalist(journalistData);

          // Get most recent article for personalization
          const recentArticle = journalist.recent_articles?.[0];

          // Generate personalized email
          const emailBody = await generatePersonalizedEmail({
            journalistName: `${journalist.first_name} ${journalist.last_name}`.trim() || "there",
            publication: journalist.publication_name || "your publication",
            articleTitle: recentArticle?.title || "your recent article",
            topic,
            company,
            senderName,
            senderTitle
          });

          const subject = `Story idea: ${topic}`;

          // Create email record in database
          const emailRecord = await createEmailRecord(
            campaign.id,
            journalist.id,
            subject,
            emailBody
          );

          // Queue email for rate-limited sending
          const queueStatus = await rateLimiter.queueEmail({
            to: journalist.email,
            subject,
            html: emailBody,
            emailId: emailRecord.id,
            campaignId: campaign.id
          });

          emailsQueued.push({
            journalist: {
              name: `${journalist.first_name} ${journalist.last_name}`.trim(),
              email: journalist.email,
              publication: journalist.publication_name
            },
            emailId: emailRecord.id,
            queueStatus
          });
        }

        // Update campaign with total emails
        await updateCampaignStats(campaign.id, {
          total_emails: emailsQueued.length
        });

        // Return response
        res.json({
          success: true,
          campaign: {
            id: campaign.id,
            company: campaign.company,
            topic: campaign.topic,
            totalEmails: emailsQueued.length
          },
          emails: emailsQueued,
          rateLimiter: rateLimiter.getStatus()
        });

      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({ error: "Database operation failed", details: dbError.message });
      }
    });

  } catch (error) {
    console.error("Campaign error:", error);
    res.status(500).json({ error: "Failed to start campaign", details: error.message });
  }
};

/**
 * Get rate limiter status
 */
export const getRateLimiterStatus = (req, res) => {
  const status = rateLimiter.getStatus();
  res.json(status);
};

/**
 * Get all campaigns
 */
export const getCampaigns = async (req, res) => {
  try {
    const { getSupabaseClient } = await import('./supabase.js');
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ campaigns: data });

  } catch (error) {
    console.error("Error fetching campaigns:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get campaign details with emails
 */
export const getCampaignDetails = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { getCampaignEmails } = await import('./supabase.js');

    const emails = await getCampaignEmails(campaignId);

    res.json({ emails });

  } catch (error) {
    console.error("Error fetching campaign details:", error);
    res.status(500).json({ error: error.message });
  }
};

