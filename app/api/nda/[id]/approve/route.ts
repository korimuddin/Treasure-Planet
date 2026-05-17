import { NextResponse } from "next/server";
import { logAction } from "@/lib/compliance/audit";
import { buyerApprovedEmail, sendEmail } from "@/lib/email/notifications";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(_request: Request, { params }: RouteContext) {
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

  const { data: ndaRequest } = await supabase
    .from("nda_requests")
    .select("*")
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .single();

  if (!ndaRequest) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (ndaRequest.status !== "pending_review") {
    return NextResponse.json({ error: "Only pending review requests can be approved." }, { status: 400 });
  }

  const decidedAt = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("nda_requests")
    .update({
      status: "approved",
      seller_decided_at: decidedAt,
    })
    .eq("id", ndaRequest.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Unable to approve request." }, { status: 500 });
  }

  await supabase.from("listing_nda_access").upsert({
    listing_id: updated.listing_id,
    user_id: updated.buyer_id,
    status: "approved",
  });

  const [{ data: buyer }, { data: listing }, { data: settings }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", updated.buyer_id).single(),
    supabase.from("listings").select("category_label, project_name").eq("id", updated.listing_id).single(),
    supabase.from("seller_settings").select("response_message").eq("seller_id", user.id).maybeSingle(),
  ]);

  await sendEmail({
    to: buyer?.email,
    subject: "Mutual NDA request approved",
    html: buyerApprovedEmail({
      buyerName: buyer?.full_name,
      listingTitle: listing?.project_name ?? listing?.category_label ?? "your listing",
      message: settings?.response_message,
    }),
  });

  await logAction(user.id, "nda_approved", "nda_request", updated.id, {
    listing_id: updated.listing_id,
    buyer_id: updated.buyer_id,
  });

  return NextResponse.json({ request: updated });
}
