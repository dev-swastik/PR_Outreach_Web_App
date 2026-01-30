import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { upsertJournalist } from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
config({ path: resolve(__dirname, '../../.env') });

// Simulate data from scraper
const mockScraperData = {
  first_name: "Cade",
  last_name: "Metz",
  publication_name: "New York Times",
  domain: "nytimes.com",  // Note: scraper returns 'domain', not 'publication_domain'
  topics: [],
  recent_articles: [{
    title: "Test Article",
    url: "https://example.com",
    published: "2026-01-30"
  }]
};

// Simulate email data from Hunter
const mockEmailData = {
  email: "cade.metz@nytimes.com",
  confidence: 99,
  source: "hunter"
};

async function testDataFlow() {
  console.log("Testing data flow from scraper -> Hunter -> Supabase\n");

  console.log("1. Data from scraper:");
  console.log(JSON.stringify(mockScraperData, null, 2));

  console.log("\n2. Email data from Hunter:");
  console.log(JSON.stringify(mockEmailData, null, 2));

  console.log("\n3. Combined data for upsertJournalist:");
  const combinedData = {
    ...mockScraperData,
    email: mockEmailData.email,
    email_confidence: mockEmailData.confidence,
    email_source: mockEmailData.source
  };
  console.log(JSON.stringify(combinedData, null, 2));

  console.log("\n4. Saving to Supabase...");
  try {
    const journalist = await upsertJournalist(combinedData);
    console.log("✅ Successfully saved journalist:");
    console.log(JSON.stringify(journalist, null, 2));
  } catch (error) {
    console.error("❌ Error saving journalist:", error.message);
  }
}

testDataFlow().catch(console.error);
