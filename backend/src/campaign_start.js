import { startCampaign } from "./controller.js"; // adjust the path
import fs from "fs";

// Mock request and response objects
const req = {
  body: {
    company: "Dumroo.ai",
    topic: "AI Teaching Tools"
  }
};

const scraperRes = await fetch(
  `${process.env.SCRAPER_SERVICE_URL}/scrape?topic=${encodeURIComponent(topic)}`
);

if (!scraperRes.ok) {
  throw new Error("Failed to fetch journalists from scraper service");
}

if (journalist.unsubscribed) {
  console.log(`Skipping unsubscribed journalist: ${journalist.email}`);
  continue;
}
const scrapedJournalists = await scraperRes.json();

// Call the function
startCampaign(req, res);
