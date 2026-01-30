import fetch from "node-fetch";

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

export async function findJournalistEmail({ firstName, lastName, domain }) {
  if (!HUNTER_API_KEY) {
    console.log("⚠️  HUNTER_API_KEY not found - email enrichment disabled");
    return null;
  }

  if (!domain) {
    console.log(`⚠️  No domain provided for ${firstName} ${lastName}`);
    return null;
  }

  try {
    const url = `https://api.hunter.io/v2/email-finder` +
      `?domain=${domain}` +
      `&first_name=${encodeURIComponent(firstName)}` +
      `&last_name=${encodeURIComponent(lastName)}` +
      `&api_key=${HUNTER_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok) {
      console.error(`Hunter API error for ${firstName} ${lastName}:`, data);
      return null;
    }

    if (!data?.data?.email) {
      console.log(`No email found for ${firstName} ${lastName} at ${domain} (score: ${data?.data?.score || 'N/A'})`);
      return null;
    }

    console.log(`✓ Found email for ${firstName} ${lastName}: ${data.data.email} (confidence: ${data.data.score})`);
    return {
      email: data.data.email,
      confidence: data.data.score,
      source: "hunter"
    };
  } catch (error) {
    console.error(`Error fetching email for ${firstName} ${lastName}:`, error.message);
    return null;
  }
}
