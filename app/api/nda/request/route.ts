import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { buyerApprovedEmail, ndaCopyEmail, sellerReviewEmail, sendEmail } from "@/lib/email/notifications";
import { listingDisplayTitle } from "@/lib/listings/access";
import { NDA_TEXT, NDA_VERSION, ndaTextHash } from "@/lib/nda/template";

export const runtime = "nodejs";

const requestSchema = z.object({
  listing_id: z.string().uuid(),
  deal_type: z.enum(["acquire", "cofound", "merge", "undecided"]),
  budget_min_gbp: z.number().int().min(0),
  budget_max_gbp: z.number().int().min(0),
  message: z.string().max(2000).optional(),
  // Click-to-sign: required only when the listing requires an NDA.
  signed_name: z.string().trim().min(3).max(120).optional(),
  agree: z.boolean().optional(),
});

export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, profile, admin } = auth;

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: listing } = await admin
    .from("listings")
    .select("id, seller_id, status, category_label, project_name, is_anonymous, requires_nda")
    .eq("id", parsed.data.listing_id)
    .eq("status", "live")
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: "You cannot request access to your own listing." }, { status: 400 });
  }

  if (listing.requires_nda && (!parsed.data.agree || !parsed.data.signed_name)) {
    return NextResponse.json(
      { error: "Type your full legal name and tick the agreement box to sign the mutual NDA." },
      { status: 400 },
    );
  }

  const { data: existing } = await admin
    .from("nda_requests")
    .select("id, status")
    .eq("listing_id", listing.id)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You have already requested access to this listing." }, { status: 409 });
  }

  const [{ data: seller }, { data: settings }] = await Promise.all([
    admin.from("profiles").select("id, full_name, email").eq("id", listing.seller_id).single(),
    admin.from("seller_settings").select("*").eq("seller_id", listing.seller_id).maybeSingle(),
  ]);

  const autoApproved = Boolean(
    settings?.auto_approve &&
      parsed.data.budget_max_gbp >= settings.auto_approve_min_budget &&
      (settings.auto_approve_deal_types.length === 0 ||
        settings.auto_approve_deal_types.includes(parsed.data.deal_type)),
  );

  const now = new Date().toISOString();
  const signed = listing.requires_nda;
  const { data: ndaRequest, error: insertError } = await admin
    .from("nda_requests")
    .insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      deal_type: parsed.data.deal_type,
      budget_min_gbp: parsed.data.budget_min_gbp,
      budget_max_gbp: parsed.data.budget_max_gbp,
      message: parsed.data.message,
      nda_required: signed,
      signed_name: signed ? parsed.data.signed_name : null,
      signed_at: signed ? now : null,
      signed_ip: signed ? clientIp(request) : null,
      nda_version: signed ? NDA_VERSION : null,
      nda_text_sha256: signed ? ndaTextHash() : null,
      status: autoApproved ? "approved" : "pending_review",
      auto_approved: autoApproved,
      seller_decided_at: autoApproved ? now : null,
    })
    .select("*")
    .single();

  if (insertError || !ndaRequest) {
    return NextResponse.json({ error: "Unable to create the request." }, { status: 500 });
  }

  if (autoApproved) {
    await admin.from("listing_nda_access").upsert({
      listing_id: listing.id,
      user_id: user.id,
      status: "approved",
    });
  }

  // Until the seller approves, the buyer only ever sees the public title.
  const publicTitle = listingDisplayTitle(listing);
  const sellerTitle = listing.project_name ?? listing.category_label;
  const buyerName = parsed.data.signed_name ?? profile.full_name ?? "A registered buyer";

  if (signed && ndaRequest.signed_name && ndaRequest.signed_at && ndaRequest.nda_text_sha256) {
    const copy = {
      signedName: ndaRequest.signed_name,
      signedAt: ndaRequest.signed_at,
      ndaVersion: NDA_VERSION,
      ndaTextSha256: ndaRequest.nda_text_sha256,
      requestId: ndaRequest.id,
      ndaText: NDA_TEXT,
    };

    await Promise.all([
      sendEmail({
        to: user.email,
        subject: "Your copy of the mutual NDA",
        html: ndaCopyEmail({ ...copy, listingTitle: publicTitle }),
      }),
      sendEmail({
        to: seller?.email,
        subject: "A buyer signed your mutual NDA",
        html: ndaCopyEmail({ ...copy, listingTitle: sellerTitle }),
      }),
    ]).catch(() => undefined);
  }

  await sendEmail({
    to: seller?.email,
    subject: "New access request",
    html: sellerReviewEmail({
      sellerName: seller?.full_name,
      buyerName,
      listingTitle: sellerTitle,
      message: parsed.data.message,
      ndaSigned: signed,
    }),
  }).catch(() => undefined);

  if (autoApproved) {
    await sendEmail({
      to: user.email,
      subject: "Access request approved",
      html: buyerApprovedEmail({
        buyerName: profile.full_name,
        listingTitle: sellerTitle,
        message: settings?.response_message,
      }),
    }).catch(() => undefined);
  }

  await logAction(
    user.id,
    "nda_request_created",
    "nda_request",
    ndaRequest.id,
    { listing_id: listing.id, auto_approved: autoApproved, nda_signed: signed },
    clientIp(request),
  );

  return NextResponse.json({ request: ndaRequest }, { status: 201 });
}
