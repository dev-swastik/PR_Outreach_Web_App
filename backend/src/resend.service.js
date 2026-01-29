import { getSupabaseClient } from "./supabase.js";
import { Resend } from "resend";

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === "true";

const resend = EMAIL_ENABLED
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendEmailWithTracking(to, subject, html, emailId) {
  const supabase = getSupabaseClient();

  // DEV MODE
  if (!EMAIL_ENABLED) {
    console.log("[DEV MODE] Email sending disabled");
    console.log({ to, subject });

    await supabase
      .from("emails")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        resend_email_id: "dev-mode"
      })
      .eq("id", emailId);

    return { success: true, devMode: true, emailId };
  }

  // REAL SEND
  const response = await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to,
    subject,
    html
  });

  await supabase
    .from("emails")
    .update({
      resend_email_id: response.id,
      status: "sent",
      sent_at: new Date().toISOString()
    })
    .eq("id", emailId);

  const unsubscribeLink = `
  <p style="font-size:12px;color:#888;">
    <a href="${process.env.BACKEND_URL}/unsubscribe/${emailId}">
      Unsubscribe
    </a>
  </p>
`;

const trackedHtml = html + trackingPixel + unsubscribeLink;

  return { success: true, emailId };
}
