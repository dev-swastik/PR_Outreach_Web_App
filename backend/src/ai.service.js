import OpenAI from "openai";

let client = null;

function getClient() {
  if (!client) {
    client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return client;
}

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
    const fallback = fallbackEmail( journalistName, publication, articleTitle, topic, company, senderName, senderTitle);
    return fallback.html;
  }

  const prompt = `Write a professional PR outreach email with the following EXACT structure:

PARAGRAPH 1:
Hi ${journalistName}, I recently read your article "${articleTitle}" in ${publication} [add one sentence about why it resonated].

[BLANK LINE]

PARAGRAPH 2:
[One or two sentences connecting their article to ${topic} and explaining why this would interest their audience.]

[BLANK LINE]

PARAGRAPH 3:
[Soft call-to-action asking if they'd like to learn more.]

[BLANK LINE]

Best regards,
${senderName}
${senderTitle}
${company}

IMPORTANT FORMATTING RULES:
- You MUST include blank lines between each paragraph
- Keep it under 100 words (excluding signature)
- No buzzwords or emojis
- Be warm but professional`;

  try {
    const response = await getClient().chat.completions.create({
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
      const fallback = fallbackEmail(
        journalistName,
        publication,
        articleTitle,
        topic,
        company,
        senderName,
        senderTitle
      );
      return fallback.html;
    }

    const { html } = convertPlainTextToHtml(text.trim());
    return html;

  } catch (err) {
    console.error("AI email generation failed:", err);
    const fallback = fallbackEmail(
      journalistName,
      publication,
      articleTitle,
      topic,
      company,
      senderName,
      senderTitle
    );
    return fallback.html;
  }
}

/**
 * Convert plain text email to HTML format
 * Returns both HTML and plain text versions
 */
function convertPlainTextToHtml(text) {
  let processedText = text.trim();

  const signaturePatterns = /^(Best regards,|Sincerely,|Thanks,|Regards,)/im;
  const signatureMatch = processedText.match(signaturePatterns);

  if (signatureMatch) {
    const signatureIndex = processedText.indexOf(signatureMatch[0]);
    const body = processedText.substring(0, signatureIndex).trim();
    const signature = processedText.substring(signatureIndex).trim();

    const bodyParagraphs = body.split(/\n\s*\n/).filter(p => p.trim());
    const signatureLines = signature.split('\n').map(line => line.trim()).filter(line => line);

    const bodyHtml = bodyParagraphs.map(paragraph => {
      const lines = paragraph.split('\n').map(line => line.trim()).filter(line => line);
      const content = lines.join('<br/>');
      return `<p style="margin: 0 0 16px 0; line-height: 1.6;">${content}</p>`;
    }).join('');

    const signatureHtml = `<p style="margin: 20px 0 0 0; line-height: 1.6;">${signatureLines.join('<br/>')}</p>`;

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333; max-width: 600px;">
  ${bodyHtml}${signatureHtml}
</div>
    `.trim();

    return { html, text: processedText };
  }

  const paragraphs = processedText.split(/\n\s*\n/).filter(p => p.trim());

  const htmlParagraphs = paragraphs.map(paragraph => {
    const lines = paragraph.split('\n').map(line => line.trim()).filter(line => line);
    const content = lines.join('<br/>');
    return `<p style="margin: 0 0 16px 0; line-height: 1.6;">${content}</p>`;
  });

  const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333; max-width: 600px;">
  ${htmlParagraphs.join('')}
</div>
  `.trim();

  return {
    html,
    text: processedText
  };
}

export async function generateCustomEmail({
  journalistName,
  publication,
  referenceContent,
  objective,
  tone,
  length,
  companyName,
  companyDescription
}) {
  if (!process.env.OPENAI_API_KEY) {
    console.error("ERROR: OPENAI_API_KEY not set in environment!");
    return {
      subject: 'Partnership Opportunity',
      body: '<p>Hi, I wanted to reach out regarding a potential collaboration.</p>'
    };
  }

  const lengthGuide = {
    'Short': '50-75 words',
    'Medium': '100-150 words',
    'Long': '150-200 words'
  };

  const prompt = `Generate a professional email with these specifications:

Recipient: ${journalistName || 'the recipient'}
${publication ? `Publication: ${publication}` : ''}
Objective: ${objective}
Tone: ${tone}
Length: ${lengthGuide[length] || '100-150 words'}
${referenceContent ? `Reference Content: ${referenceContent}` : ''}
${companyName ? `Company: ${companyName}` : ''}
${companyDescription ? `Company Description: ${companyDescription}` : ''}

Generate an email with:
1. A compelling subject line (max 60 characters)
2. Professional email body following these rules:
   - Start with a personalized greeting
   - Reference the provided context naturally
   - Clearly state the objective
   - Include a soft call-to-action
   - End with a professional signature
   - Use the specified tone throughout

Format your response EXACTLY as:
Subject: [Your subject line]

[Email body content]

IMPORTANT: You must include "Subject:" at the start and separate it from the body with a blank line.`;

  try {
    const response = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You write concise, professional PR emails. Always format responses with 'Subject:' followed by the subject line, then a blank line, then the email body." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7
    });

    const text = response.choices?.[0]?.message?.content;

    if (!text) {
      console.warn("OpenAI returned empty response", response);
      return {
        subject: 'Partnership Opportunity',
        body: '<p>Hi, I wanted to reach out regarding a potential collaboration.</p>'
      };
    }

    const subjectMatch = text.match(/Subject:\s*(.+?)(?:\n|$)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : 'Follow Up';

    let bodyText = text.replace(/Subject:\s*.+?(?:\n\s*\n|\n)/i, '').trim();

    const { html } = convertPlainTextToHtml(bodyText);

    return { subject, body: html };

  } catch (err) {
    console.error("AI custom email generation failed:", err);
    return {
      subject: 'Partnership Opportunity',
      body: '<p>Hi, I wanted to reach out regarding a potential collaboration.</p>'
    };
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
  const plainText = `Hi ${name || "there"},

I recently read your article "${article}" in ${publication} and thought it aligned well with the work we're doing at ${company}.

We're currently exploring ${topic}, and I believe it could be a useful angle for your audience.

If this sounds interesting, I'd be happy to share more details.

Best regards,
${senderName}
${senderTitle}
${company}`;

  return convertPlainTextToHtml(plainText);
}