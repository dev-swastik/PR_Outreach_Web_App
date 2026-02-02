import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generatePersonalizedEmail({
  journalistName,
  publication,
  articleTitle,
  topic,
  company,
  senderName,
  senderTitle
}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY not set in environment!");
    return fallbackEmail( journalistName, publication, articleTitle, topic, company, senderName, senderTitle);
  }

  const prompt = `
You are a PR outreach assistant.

Write a short, friendly, personalized outreach email.

Context:
- Journalist: ${journalistName}
- Publication: ${publication}
- Article they wrote: "${articleTitle}"
- Company pitching the story: ${company}
- Campaign topic: ${topic}
- Sender name: ${senderName}
- Sender role: ${senderTitle}

Guidelines:
- Sign the email using the sender name and role
- Do NOT use placeholders like [Your Name]
- Mention the article naturally
- Explain why the topic fits their beat
- Be concise (max 120 words)
- No emojis, no buzzwords
- End with a soft call-to-action
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You write concise, professional PR emails." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6
    });

    const text = response.choices?.[0]?.message?.content;

    if (!text) {
      console.warn("OpenAI returned empty response", response);
      return fallbackEmail(
        journalistName,
        publication,
        articleTitle,
        topic,
        company,
        senderName,
        senderTitle
      );
    }

    return text.trim();

  } catch (err) {
    console.error("AI email generation failed:", err);
    return fallbackEmail(
      journalistName,
      publication,
      articleTitle,
      topic,
      company,
      senderName,
      senderTitle
    );
  }
}

/**
 * Fallback email template if AI fails
 */
function fallbackEmail(
  name,
  publication,
  article,
  topic,
  company,
  senderName = "PR Team",
  senderTitle = ""
) {
  return `Hi ${name || "there"},

I recently read your article "${article}" in ${publication} and thought it aligned well with the work we're doing at ${company}.

We’re currently exploring ${topic}, and I believe it could be a useful angle for your audience.

If this sounds interesting, I’d be happy to share more details.

Best regards,
${senderName}
${senderTitle}
${company}`;
}