import { Resend } from "resend";

// Uses Resend's shared onboarding@resend.dev sender by default, which only
// delivers to the email address you signed up to Resend with — fine for
// testing, but for real family-wide delivery set RESEND_FROM_EMAIL to an
// address on a domain you've verified in the Resend dashboard.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Same card layout as the Supabase invite/reset-password templates
// (supabase/email-templates/*.html) — kept in sync by hand since these two
// are triggered from application code rather than Supabase's own mailer.
function renderEmailCard(params: {
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const { heading, bodyHtml, ctaLabel, ctaHref } = params;

  const cta =
    ctaLabel && ctaHref
      ? `
        <tr>
          <td style="padding:0 40px 40px 40px; text-align:center;">
            <a href="${ctaHref}" style="display:inline-block; background-color:#73a9ad; color:#ffffff; font-size:16px; font-weight:600; text-decoration:none; padding:14px 36px; border-radius:999px;">
              ${ctaLabel}
            </a>
          </td>
        </tr>`
      : "";

  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#c4dfaa; padding:40px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.08);">
        <tr>
          <td style="padding:40px 40px 24px 40px; text-align:center;">
            <span style="display:inline-block; margin:0 0 20px 0; padding:6px 14px; border-radius:999px; background-color:#f5f0bb; font-size:12px; font-weight:700; letter-spacing:2px; color:#4c7478; text-transform:uppercase;">L'Île d'Yeu</span>
            <p style="margin:16px 0 16px 0; font-size:24px; line-height:32px; font-weight:700; color:#222222;">${heading}</p>
            <div style="font-size:16px; line-height:24px; color:#484848; text-align:left;">
              ${bodyHtml}
            </div>
          </td>
        </tr>${cta}
      </table>
      <p style="margin:24px 0 0 0; font-size:12px; color:#3f6266; text-align:center;">
        La Maison de l'Île d'Yeu
      </p>
    </td>
  </tr>
</table>`;
}

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function sendEmail(to: string[], subject: string, html: string) {
  if (to.length === 0) {
    // Most often this means no one in the target family branch has an
    // email on file yet — worth knowing about, but shouldn't block the
    // booking/approval action that triggered the send.
    console.warn("No recipients — skipping email:", subject);
    return;
  }

  const resend = getClient();
  if (!resend) {
    // No API key configured — don't break booking flows over email being
    // unset, just skip silently (this is logged so it's easy to notice in
    // dev without failing the request).
    console.warn("RESEND_API_KEY not set — skipping email:", subject);
    return;
  }

  if (FROM_EMAIL === "onboarding@resend.dev") {
    // Resend's shared sandbox sender only delivers to the email address
    // you signed up to Resend with — every other recipient is silently
    // rejected. This is almost always why "it worked when I tested it
    // myself but no one else got the email." See README 2.5.
    console.warn(
      "RESEND_FROM_EMAIL not set (using the shared onboarding@resend.dev sender) — delivery to anyone other than your own Resend account email will fail:",
      subject,
    );
  }

  try {
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) {
      // The SDK resolves with an `error` field on API-level rejections
      // (e.g. the sandbox-sender restriction above) rather than throwing.
      console.error("Resend rejected the email:", subject, error);
    }
  } catch (err) {
    // Same reasoning: a broken email send shouldn't break the booking or
    // approval action that triggered it.
    console.error("Failed to send email:", err);
  }
}

export async function sendPendingApprovalEmail(params: {
  to: string[];
  requesterName: string;
  houseName: string;
  roomNames: string[];
  startDate: string;
  endDate: string;
  familyBranch: string;
}) {
  const { to, requesterName, houseName, roomNames, startDate, endDate, familyBranch } = params;

  const bodyHtml = `
    <p style="margin:0 0 12px 0;"><strong>${requesterName}</strong> a demandé à réserver
    un séjour qui tombe pendant la période prioritaire de la famille
    <strong>${familyBranch}</strong> :</p>
    <ul style="margin:0 0 12px 0; padding-left:20px;">
      <li>Maison : ${houseName}</li>
      <li>Chambre(s) : ${roomNames.join(", ")}</li>
      <li>Dates : du ${startDate} au ${endDate}</li>
    </ul>
    <p style="margin:0;">Un membre de votre famille peut approuver cette demande
    depuis la page « Réservations » du site.</p>
  `;

  await sendEmail(
    to,
    "Demande de séjour pendant votre période prioritaire",
    renderEmailCard({
      heading: "Demande de séjour",
      bodyHtml,
      ctaLabel: "Voir la demande",
      ctaHref: `${SITE_URL}/bookings`,
    }),
  );
}

export async function sendApprovalGrantedEmail(params: {
  to: string;
  houseName: string;
  roomNames: string[];
  startDate: string;
  endDate: string;
}) {
  const { to, houseName, roomNames, startDate, endDate } = params;

  const bodyHtml = `
    <p style="margin:0 0 12px 0;">Votre demande de séjour a été approuvée :</p>
    <ul style="margin:0 0 12px 0; padding-left:20px;">
      <li>Maison : ${houseName}</li>
      <li>Chambre(s) : ${roomNames.join(", ")}</li>
      <li>Dates : du ${startDate} au ${endDate}</li>
    </ul>
    <p style="margin:0;">Votre réservation est maintenant confirmée.</p>
  `;

  await sendEmail(
    [to],
    "Votre séjour a été approuvé",
    renderEmailCard({
      heading: "Séjour approuvé !",
      bodyHtml,
      ctaLabel: "Voir mon séjour",
      ctaHref: `${SITE_URL}/bookings`,
    }),
  );
}
