import { NextResponse } from "next/server";
import { checkTransactionForAML } from "@/lib/compliance/aml";
import { logAction } from "@/lib/compliance/audit";
import { createDealPaymentIntent, checkSellerOnboarded } from "@/lib/stripe/connect";
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

  if (deal.status !== "loi_accepted") {
    return NextResponse.json({ error: "LOI must be accepted before payment." }, { status: 400 });
  }

  const { data: seller } = await supabase
    .from("profiles")
    .select("stripe_connect_account_id, stripe_connect_charges_enabled")
    .eq("id", deal.seller_id)
    .single();

  if (!seller?.stripe_connect_account_id) {
    return NextResponse.json({ error: "Seller payment setup is incomplete." }, { status: 403 });
  }

  const onboarded = seller.stripe_connect_charges_enabled
    ? true
    : await checkSellerOnboarded(seller.stripe_connect_account_id);

  if (!onboarded) {
    return NextResponse.json({ error: "Seller payment setup is incomplete." }, { status: 403 });
  }

  const aml = await checkTransactionForAML(deal);

  if (aml.flagged) {
    await logAction(user.id, "aml_flags_created", "deal", deal.id, { flags: aml.flags });
  }

  const paymentIntent = await createDealPaymentIntent(
    deal.agreed_price_gbp,
    seller.stripe_connect_account_id,
    deal.id,
    user.id,
  );

  const { data: updated, error } = await supabase
    .from("deals")
    .update({
      status: "in_escrow",
      stripe_payment_intent_id: paymentIntent.id,
      platform_fee_gbp: paymentIntent.application_fee_amount ?? null,
      payment_made_at: new Date().toISOString(),
    })
    .eq("id", deal.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Unable to initiate payment." }, { status: 500 });
  }

  await logAction(user.id, "deal_payment_initiated", "deal", deal.id, {
    payment_intent_id: paymentIntent.id,
  });

  return NextResponse.json({
    deal: updated,
    client_secret: paymentIntent.client_secret,
  });
}
