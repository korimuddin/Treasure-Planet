import { NextResponse } from "next/server";
import { logAction } from "@/lib/compliance/audit";
import { releaseFunds } from "@/lib/stripe/connect";
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
    .eq("buyer_id", user.id)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  if (deal.status !== "ip_transferred" || !deal.stripe_payment_intent_id) {
    return NextResponse.json({ error: "Receipt can only be confirmed after transfer." }, { status: 400 });
  }

  const paymentIntent = await releaseFunds(deal.stripe_payment_intent_id);
  const capturedPayment = paymentIntent as typeof paymentIntent & { transfer?: string | null };
  const completedAt = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("deals")
    .update({
      status: "completed",
      completed_at: completedAt,
      stripe_transfer_id: typeof capturedPayment.transfer === "string" ? capturedPayment.transfer : null,
    })
    .eq("id", deal.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Unable to complete deal." }, { status: 500 });
  }

  try {
    const admin = createAdminClient();
    const [{ data: buyer }, { data: seller }] = await Promise.all([
      admin.from("profiles").select("deal_count").eq("id", deal.buyer_id).single(),
      admin.from("profiles").select("deal_count").eq("id", deal.seller_id).single(),
    ]);

    await Promise.all([
      admin.from("listings").update({ status: "sold", sold_at: completedAt }).eq("id", deal.listing_id),
      admin
        .from("profiles")
        .update({ deal_count: (buyer?.deal_count ?? 0) + 1 })
        .eq("id", deal.buyer_id),
      admin
        .from("profiles")
        .update({ deal_count: (seller?.deal_count ?? 0) + 1 })
        .eq("id", deal.seller_id),
    ]);
  } catch {
    // Admin credentials may be absent in local preview.
  }

  await logAction(user.id, "deal_completed", "deal", deal.id, {
    payment_intent_id: deal.stripe_payment_intent_id,
  });

  return NextResponse.json({ deal: updated });
}
