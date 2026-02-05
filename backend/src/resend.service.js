import { getSupabaseClient } from "./supabase.js";
import { Resend } from "resend";

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";
const DEV_MODE = process.env.DEV_MODE === "true";
const DEV_TEST_EMAIL = process.env.DEV_TEST_EMAIL;

const resend = EMAIL_ENABLED
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmailWithTracking(to, subject, html, emailId) {
  const supabase = getSupabaseClient();

  // Add tracking pixel and unsubscribe link
  const trackingPixel = `<img src="${process.env.BACKEND_URL}/track/open/${emailId}" width="1" height="1" style="display:none;" />`;

  const unsubscribeLink = `
  <p style="font-size:12px;color:#888;margin-top:20px;">
    <a href="${process.env.BACKEND_URL}/unsubscribe/${emailId}" style="color:#888;">
      Unsubscribe
    </a>
  </p>
`;

  const trackedHtml = html + trackingPixel + unsubscribeLink;

  // DEV MODE - Store the complete email with tracking for testing
  if (!EMAIL_ENABLED) {
    console.log("[DEV MODE] Email sending disabled - storing in database for review");
    console.log({ to, subject, emailId });

    // Save the complete HTML (with tracking pixel and unsubscribe link) to database
    await supabase
      .from("emails")
      .update({
        body: trackedHtml,
        status: "sent",
        sent_at: new Date().toISOString(),
        resend_email_id: "dev-mode"
      })
      .eq("id", emailId);

    console.log(`✓ Email stored in database with tracking. View in Supabase: emails table, id=${emailId}`);

    return { success: true, devMode: true, emailId };
  }

  // DEV MODE WITH EMAIL SENDING - Send to test email instead of real recipient
  if (DEV_MODE && DEV_TEST_EMAIL) {
    console.log(`[DEV MODE] Redirecting email from ${to} to ${DEV_TEST_EMAIL}`);

    const devNotice = `
    <div style="background:#fff3cd;border:1px solid #ffc107;padding:15px;margin-bottom:20px;border-radius:4px;">
      <strong>🧪 DEV MODE TEST EMAIL</strong><br/>
      <strong>Original Recipient:</strong> ${to}<br/>
      <strong>Original Subject:</strong> ${subject}<br/>
      <strong>Email ID:</strong> ${emailId}
    </div>
    `;

    const devTrackedHtml = devNotice + trackedHtml;
    const devSubject = `[DEV TEST] ${subject}`;

    const response = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: DEV_TEST_EMAIL,
      subject: devSubject,
      html: devTrackedHtml
    });

    await supabase
      .from("emails")
      .update({
        resend_email_id: response.id,
        status: "sent",
        sent_at: new Date().toISOString()
      })
      .eq("id", emailId);

    console.log(`✓ Dev test email sent to ${DEV_TEST_EMAIL} (original: ${to})`);
    return { success: true, devMode: true, emailId, testEmail: DEV_TEST_EMAIL };
  }

  // REAL SEND
  const response = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html: trackedHtml
  });

  await supabase
    .from("emails")
    .update({
      resend_email_id: response.id,
      status: "sent",
      sent_at: new Date().toISOString()
    })
    .eq("id", emailId);

  return { success: true, emailId };
}
