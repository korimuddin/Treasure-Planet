import { Resend } from "resend";

type EmailParams = {
  to?: string | null;
  subject: string;
  html: string;
};

export async function sendEmail({ to, subject, html }: EmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@treasureplanet.io";

  if (!apiKey || !to) {
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to,
    subject,
    html,
  });
}

export function sellerReviewEmail(params: {
  sellerName?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  listingTitle: string;
  message?: string | null;
}) {
  return `
    <p>${params.sellerName ?? "Hello"},</p>
    <p>A buyer has completed a mutual NDA request for <strong>${params.listingTitle}</strong>.</p>
    <p><strong>Buyer:</strong> ${params.buyerName ?? params.buyerEmail ?? "Verified buyer"}</p>
    ${params.message ? `<p><em>${params.message}</em></p>` : ""}
    <p>Review the request from your seller dashboard.</p>
  `;
}

export function buyerApprovedEmail(params: { buyerName?: string | null; listingTitle: string; message?: string | null }) {
  return `
    <p>${params.buyerName ?? "Hello"},</p>
    <p>Your mutual NDA request for <strong>${params.listingTitle}</strong> has been approved.</p>
    <p>${params.message ?? "Thank you — you now have full data room access."}</p>
  `;
}

export function buyerDeclinedEmail(params: { buyerName?: string | null; listingTitle: string; reason?: string | null }) {
  return `
    <p>${params.buyerName ?? "Hello"},</p>
    <p>Your mutual NDA request for <strong>${params.listingTitle}</strong> was declined.</p>
    ${params.reason ? `<p>${params.reason}</p>` : ""}
  `;
}
