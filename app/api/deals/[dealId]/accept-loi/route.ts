import { NextResponse } from "next/server";
import { logAction } from "@/lib/compliance/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { dealId: string } };

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

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", params.dealId)
    .eq("seller_id", user.id)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  if (deal.status !== "loi_sent") {
    return NextResponse.json({ error: "Only sent LOIs can be accepted." }, { status: 400 });
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 75);

  const { data: updated, error } = await supabase
    .from("deals")
    .update({
      status: "loi_accepted",
      loi_accepted_at: now.toISOString(),
      noshop_activated_at: now.toISOString(),
      noshop_expires_at: expires.toISOString(),
    })
    .eq("id", deal.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Unable to accept LOI." }, { status: 500 });
  }

  try {
    const admin = createAdminClient();
    await Promise.all([
      admin.from("listings").update({ status: "under_offer" }).eq("id", deal.listing_id),
      admin
        .from("nda_requests")
        .update({ status: "expired" })
        .eq("listing_id", deal.listing_id)
        .neq("id", deal.nda_request_id ?? ""),
    ]);
  } catch {
    // Admin credentials may be absent in local preview.
  }

  await logAction(user.id, "loi_accepted", "deal", updated.id, {
    noshop_expires_at: updated.noshop_expires_at,
  });

  return NextResponse.json({ deal: updated });
}
