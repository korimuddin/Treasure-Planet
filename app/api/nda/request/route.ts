import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { buyerApprovedEmail, sellerReviewEmail, sendEmail } from "@/lib/email/notifications";
import { createMutualNDA, sendNDAForSigning } from "@/lib/pandadoc/client";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const requestSchema = z.object({
  listing_id: z.string().uuid(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  capacity: z.enum(["company", "individual"]),
  country: z.string().min(1),
  deal_type: z.enum(["acquire", "cofound", "merge", "undecided"]),
  budget_min_gbp: z.number().int().min(0),
  budget_max_gbp: z.number().int().min(0),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: buyer } = await supabase
    .from("profiles")
    .select("id, full_name, email, kyc_status, company, country, avatar_initials")
    .eq("id", user.id)
    .single();

  if (!buyer || buyer.kyc_status !== "verified") {
    return NextResponse.json({ error: "KYC verification is required before requesting access." }, { status: 403 });
  }

  const { data: listing } = await supabase
    .from("listings")
    .select("id, seller_id, status, category_label, project_name, asking_price_gbp")
    .eq("id", parsed.data.listing_id)
    .eq("status", "live")
    .single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const { data: existing } = await supabase
    .from("nda_requests")
    .select("*")
    .eq("listing_id", listing.id)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "Request already exists.", request: existing }, { status: 409 });
  }

  const { data: seller } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("id", listing.seller_id)
    .single();

  const { data: settings } = await supabase
    .from("seller_settings")
    .select("*")
    .eq("seller_id", listing.seller_id)
    .maybeSingle();

  const autoApproved = Boolean(
    settings?.auto_approve &&
      parsed.data.budget_max_gbp >= settings.auto_approve_min_budget &&
      (settings.auto_approve_deal_types.length === 0 ||
        settings.auto_approve_deal_types.includes(parsed.data.deal_type)),
  );

  const { data: ndaRequest, error: insertError } = await supabase
    .from("nda_requests")
    .insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      deal_type: parsed.data.deal_type,
      budget_min_gbp: parsed.data.budget_min_gbp,
      budget_max_gbp: parsed.data.budget_max_gbp,
      message: parsed.data.message,
      status: "pending_nda",
      auto_approved: autoApproved,
    })
    .select("*")
    .single();

  if (insertError || !ndaRequest) {
    return NextResponse.json({ error: insertError?.message ?? "Unable to create request." }, { status: 500 });
  }

  const listingTitle = listing.project_name ?? listing.category_label;
  const buyerName = `${parsed.data.first_name} ${parsed.data.last_name}`;

  try {
    const document = await createMutualNDA({
      buyerName,
      buyerEmail: parsed.data.email,
      sellerEmail: seller?.email ?? "",
      listingTitle,
      ndaRequestId: ndaRequest.id,
    });

    await sendNDAForSigning(document.id);

    await supabase
      .from("nda_requests")
      .update({
        pandadoc_doc_id: document.id,
      })
      .eq("id", ndaRequest.id);
  } catch (error) {
    await supabase
      .from("nda_requests")
      .update({
        pandadoc_status: "configuration_error",
      })
      .eq("id", ndaRequest.id);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to prepare the mutual NDA." },
      { status: 500 },
    );
  }

  await sendEmail({
    to: seller?.email,
    subject: "New mutual NDA request",
    html: sellerReviewEmail({
      sellerName: seller?.full_name,
      buyerName,
      buyerEmail: parsed.data.email,
      listingTitle,
      message: parsed.data.message,
    }),
  });

  await logAction(user.id, "nda_request_created", "nda_request", ndaRequest.id, {
    listing_id: listing.id,
    auto_approved: autoApproved,
  });

  if (autoApproved) {
    await sendEmail({
      to: parsed.data.email,
      subject: "Mutual NDA request approved",
      html: buyerApprovedEmail({
        buyerName,
        listingTitle,
        message: settings?.response_message,
      }),
    });
  }

  return NextResponse.json({ request: { ...ndaRequest, auto_approved: autoApproved } }, { status: 201 });
}
