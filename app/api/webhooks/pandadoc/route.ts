import { NextResponse } from "next/server";
import { buyerApprovedEmail, sellerReviewEmail, sendEmail } from "@/lib/email/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.PANDADOC_WEBHOOK_SECRET;
  const receivedSecret = request.headers.get("x-pandadoc-secret");

  if (!secret || receivedSecret !== secret) {
    return NextResponse.json({ error: "Invalid webhook secret." }, { status: 401 });
  }

  const payload = await request.json();
  const eventName = payload.event ?? payload.event_type ?? payload.type;

  if (eventName !== "document_completed") {
    return NextResponse.json({ received: true });
  }

  const documentId = payload.data?.id ?? payload.data?.document?.id ?? payload.document?.id;
  const requestId = payload.data?.metadata?.nda_request_id ?? payload.metadata?.nda_request_id;
  const supabase = createAdminClient();
  const query = requestId
    ? supabase.from("nda_requests").select("*").eq("id", requestId)
    : supabase.from("nda_requests").select("*").eq("pandadoc_doc_id", documentId);
  const { data: ndaRequest } = await query.single();

  if (!ndaRequest) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  const nextStatus = ndaRequest.auto_approved ? "approved" : "pending_review";
  const { data: updated } = await supabase
    .from("nda_requests")
    .update({
      pandadoc_status: "completed",
      pandadoc_signed_at: new Date().toISOString(),
      status: nextStatus,
      seller_decided_at: ndaRequest.auto_approved ? new Date().toISOString() : null,
    })
    .eq("id", ndaRequest.id)
    .select("*")
    .single();

  const [{ data: buyer }, { data: seller }, { data: listing }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", ndaRequest.buyer_id).single(),
    supabase.from("profiles").select("full_name, email").eq("id", ndaRequest.seller_id).single(),
    supabase.from("listings").select("category_label, project_name").eq("id", ndaRequest.listing_id).single(),
    supabase.from("seller_settings").select("response_message").eq("seller_id", ndaRequest.seller_id).maybeSingle(),
  ]);

  const listingTitle = listing?.project_name ?? listing?.category_label ?? "your listing";

  if (updated?.status === "approved") {
    await supabase.from("listing_nda_access").upsert({
      listing_id: ndaRequest.listing_id,
      user_id: ndaRequest.buyer_id,
      status: "approved",
    });

    await sendEmail({
      to: buyer?.email,
      subject: "Mutual NDA request approved",
      html: buyerApprovedEmail({
        buyerName: buyer?.full_name,
        listingTitle,
        message: settings?.response_message,
      }),
    });
  } else {
    await sendEmail({
      to: seller?.email,
      subject: "Mutual NDA ready for review",
      html: sellerReviewEmail({
        sellerName: seller?.full_name,
        buyerName: buyer?.full_name,
        buyerEmail: buyer?.email,
        listingTitle,
        message: ndaRequest.message,
      }),
    });
  }

  return NextResponse.json({ received: true });
}
