import { Resend } from "resend";

type EmailParams = {
  to?: string | null;
  subject: string;
  html: string;
};

/** Escapes user-supplied text before it is placed in an HTML email. */
export function escapeHtml(value: string | null | undefined) {
  return (value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

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
  listingTitle: string;
  message?: string | null;
  ndaSigned: boolean;
}) {
  return `
    <p>${escapeHtml(params.sellerName) || "Hello"},</p>
    <p>A buyer has ${params.ndaSigned ? "signed the mutual NDA and " : ""}requested access to <strong>${escapeHtml(params.listingTitle)}</strong>.</p>
    <p><strong>Buyer:</strong> ${escapeHtml(params.buyerName) || "A registered buyer"}</p>
    ${params.message ? `<p><em>${escapeHtml(params.message)}</em></p>` : ""}
    <p>Review the request from your seller dashboard.</p>
  `;
}

export function buyerApprovedEmail(params: { buyerName?: string | null; listingTitle: string; message?: string | null }) {
  return `
    <p>${escapeHtml(params.buyerName) || "Hello"},</p>
    <p>Your access request for <strong>${escapeHtml(params.listingTitle)}</strong> has been approved.</p>
    <p>${escapeHtml(params.message) || "You can now view the private project details."}</p>
  `;
}

export function buyerDeclinedEmail(params: { buyerName?: string | null; listingTitle: string; reason?: string | null }) {
  return `
    <p>${escapeHtml(params.buyerName) || "Hello"},</p>
    <p>Your access request for <strong>${escapeHtml(params.listingTitle)}</strong> was declined.</p>
    ${params.reason ? `<p>${escapeHtml(params.reason)}</p>` : ""}
  `;
}

/** The signed-NDA record emailed to both parties. This email is each party's copy. */
export function ndaCopyEmail(params: {
  listingTitle: string;
  signedName: string;
  signedAt: string;
  ndaVersion: string;
  ndaTextSha256: string;
  requestId: string;
  ndaText: string;
}) {
  return `
    <p>This is your copy of the mutual confidentiality agreement recorded on Treasure Planet for <strong>${escapeHtml(params.listingTitle)}</strong>.</p>
    <p>
      <strong>Buyer signature:</strong> ${escapeHtml(params.signedName)}<br />
      <strong>Signed at (UTC):</strong> ${escapeHtml(params.signedAt)}<br />
      <strong>Agreement version:</strong> ${escapeHtml(params.ndaVersion)}<br />
      <strong>Text fingerprint (SHA-256):</strong> ${escapeHtml(params.ndaTextSha256)}<br />
      <strong>Request reference:</strong> ${escapeHtml(params.requestId)}
    </p>
    <p>The seller accepted the same terms when publishing the listing. Treasure Planet records the agreement but is not a party to it.</p>
    <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(params.ndaText)}</pre>
  `;
}
