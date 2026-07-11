import { Resend } from "resend";

// Uses Resend's shared onboarding@resend.dev sender by default, which only
// delivers to the email address you signed up to Resend with — fine for
// testing, but for real family-wide delivery set RESEND_FROM_EMAIL to an
// address on a domain you've verified in the Resend dashboard.
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function sendEmail(to: string[], subject: string, html: string) {
  if (to.length === 0) return;

  const resend = getClient();
  if (!resend) {
    // No API key configured — don't break booking flows over email being
    // unset, just skip silently (this is logged so it's easy to notice in
    // dev without failing the request).
    console.warn("RESEND_API_KEY not set — skipping email:", subject);
    return;
  }

  try {
    await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
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

  await sendEmail(
    to,
    "Demande de séjour pendant votre période prioritaire",
    `
      <p>Bonjour,</p>
      <p><strong>${requesterName}</strong> a demandé à réserver un séjour qui tombe
      pendant la période prioritaire de la famille <strong>${familyBranch}</strong> :</p>
      <ul>
        <li>Maison : ${houseName}</li>
        <li>Chambre(s) : ${roomNames.join(", ")}</li>
        <li>Dates : du ${startDate} au ${endDate}</li>
      </ul>
      <p>Un membre de votre famille peut approuver cette demande depuis la page
      « Réservations » du site.</p>
    `,
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

  await sendEmail(
    [to],
    "Votre séjour a été approuvé",
    `
      <p>Bonjour,</p>
      <p>Votre demande de séjour a été approuvée :</p>
      <ul>
        <li>Maison : ${houseName}</li>
        <li>Chambre(s) : ${roomNames.join(", ")}</li>
        <li>Dates : du ${startDate} au ${endDate}</li>
      </ul>
      <p>Votre réservation est maintenant confirmée.</p>
    `,
  );
}
