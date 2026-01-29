import fetch from "node-fetch";

const HUNTER_API_KEY = process.env.HUNTER_API_KEY;

export async function findJournalistEmail({ firstName, lastName, domain }) {
  if (!HUNTER_API_KEY || !domain) return null;

  const url = `https://api.hunter.io/v2/email-finder` +
    `?domain=${domain}` +
    `&first_name=${encodeURIComponent(firstName)}` +
    `&last_name=${encodeURIComponent(lastName)}` +
    `&api_key=${HUNTER_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  if (!data?.data?.email) return null;

  return {
    email: data.data.email,
    confidence: data.data.score,
    source: "hunter"
  };
}
