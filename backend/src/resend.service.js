import { getSupabaseClient } from "./supabase.js";
import { Resend } from "resend";

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    console.log("[DEV MODE] Email sending disabled - storing in database and sending to test email");
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

    // ALSO send to personal test email to check delivery and functionality
    const TEST_EMAIL = "swastik@dumroo.ai"; // Replace with your personal email

    const devNotice = `
    <div style="background:#fff3cd;border:1px solid #ffc107;padding:15px;margin-bottom:20px;border-radius:4px;">
      <strong> DEV MODE TEST EMAIL</strong><br/>
      <strong>Original Recipient:</strong> ${to}<br/>
      <strong>Original Subject:</strong> ${subject}<br/>
      <strong>Email ID:</strong> ${emailId}<br/>
      <strong>Note:</strong> Tracking and unsubscribe links are fully functional for testing.
    </div>
    `;

    const devTrackedHtml = devNotice + trackedHtml;
    const devSubject = `[DEV TEST] ${subject}`;

    try {
      const response = await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: TEST_EMAIL,
        subject: devSubject,
        html: devTrackedHtml
      });
      console.log(`✓ Dev test email sent to ${TEST_EMAIL} (Resend ID: ${response.id})`);
    } catch (error) {
      console.error(`✗ Failed to send dev test email:`, error.message);
    }

    return { success: true, devMode: true, emailId };
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
