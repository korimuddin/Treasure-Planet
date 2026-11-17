import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";

type RouteContext = { params: { dealId: string } };

/** Accepts the terms on the table. You cannot accept terms you proposed yourself. */
export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const { data: deal } = await admin.from("deals").select("*").eq("id", params.dealId).maybeSingle();

  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  const loi = deal.loi_data as { submitted_by?: string } | null;

  if (deal.status !== "loi_sent" || !loi?.submitted_by) {
    return NextResponse.json({ error: "There are no proposed terms to accept." }, { status: 400 });
  }

  if (loi.submitted_by === user.id) {
    return NextResponse.json({ error: "The other party must accept the terms you proposed." }, { status: 403 });
  }

  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + 75);

  // Guarding on the exact price stops a counter-offer slipping in between
  // reading the terms and accepting them.
  const { data: updated } = await admin
    .from("deals")
    .update({
      status: "loi_accepted",
      loi_accepted_at: now.toISOString(),
      noshop_activated_at: now.toISOString(),
      noshop_expires_at: expires.toISOString(),
    })
    .eq("id", deal.id)
    .eq("status", "loi_sent")
    .eq("agreed_price_gbp", deal.agreed_price_gbp)
    .select("*")
    .maybeSingle();

  if (!updated) {
    return NextResponse.json({ error: "The terms changed. Refresh and review them again." }, { status: 409 });
  }

  await admin.from("listings").update({ status: "under_offer" }).eq("id", deal.listing_id).eq("status", "live");

  let others = admin
    .from("nda_requests")
    .update({ status: "expired" })
    .eq("listing_id", deal.listing_id)
    .in("status", ["pending_nda", "pending_review"]);

  if (deal.nda_request_id) {
    others = others.neq("id", deal.nda_request_id);
  }

  await others;

  await logAction(user.id, "loi_accepted", "deal", updated.id, {
    agreed_price_gbp: updated.agreed_price_gbp,
    noshop_expires_at: updated.noshop_expires_at,
  });

  return NextResponse.json({ deal: updated });
}
