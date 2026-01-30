import express from "express";
import cors from "cors";
import {
  startCampaign,
  getRateLimiterStatus,
  getCampaigns,
  getCampaignDetails,
  generateEmail,
  previewEmail
} from "./controller.js";
import {
  trackEmailOpen,
  trackEmailClick,
  handleResendWebhook,
  unsubscribe,
  getCampaignAnalytics
} from "./tracking.js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({
    path: path.resolve(process.cwd(), "..", ".env")
});

console.log("CWD:", process.cwd());
console.log("Environment variables loaded:");
console.log("- GOOGLE_API_KEY:", !!process.env.GOOGLE_API_KEY);
console.log("- SUPABASE_URL:", !!process.env.SUPABASE_URL);
console.log("- SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log("- RESEND_API_KEY:", !!process.env.RESEND_API_KEY);
console.log("- HUNTER_API_KEY:", !!process.env.HUNTER_API_KEY);
console.log("- SCRAPER_SERVICE_URL:", !!process.env.SCRAPER_SERVICE_URL, process.env.SCRAPER_SERVICE_URL);
console.log(
  "- EMAIL_ENABLED (raw):",
  process.env.EMAIL_ENABLED,
  "| parsed:",
  process.env.EMAIL_ENABLED === "true"
);
const app = express();
app.use(cors());
app.use(express.json());

// Campaign routes
app.post("/start-campaign", startCampaign);
app.get("/campaigns", getCampaigns);
app.get("/campaigns/:campaignId", getCampaignDetails);
app.get("/campaigns/:campaignId/analytics", getCampaignAnalytics);

// Email generation
app.post("/generate-email", generateEmail);

// Email preview (for testing in dev mode)
app.get("/preview-email/:emailId", previewEmail);

// Rate limiter status
app.get("/rate-limiter/status", getRateLimiterStatus);

// Email tracking routes
app.get("/track/open/:emailId", trackEmailOpen);
app.get("/track/click/:emailId", trackEmailClick);

// Unsubscribe route
app.get("/unsubscribe/:emailId", unsubscribe);

// Resend webhook
app.post("/webhooks/resend", handleResendWebhook);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: {
      googleAI: !!process.env.GOOGLE_API_KEY,
      supabase: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      resend: !!process.env.RESEND_API_KEY,
      hunter: !!process.env.HUNTER_API_KEY,
      scraper: !!process.env.SCRAPER_SERVICE_URL
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
