import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { formatPence, maxDealPence } from "@/lib/deals/money";
import { listingDisplayTitle } from "@/lib/listings/access";
import { checkSellerOnboarded, createDealCheckoutSession, stripeClient } from "@/lib/stripe/connect";

export const runtime = "nodejs";

type RouteContext = { params: { dealId: string } };

/**
 * Starts (or resumes) Stripe Checkout for an accepted purchase. The deal only
 * becomes "payment held" when Stripe's webhook confirms the money arrived.
 */
export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const { data: deal } = await admin
    .from("deals")
    .select("*")
    .eq("id", params.dealId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  if (deal.deal_type !== "acquire") {
    return NextResponse.json(
      { error: "Only outright purchases are paid through the site. Arrange co-found and merge terms directly." },
      { status: 400 },
    );
  }

  if (deal.status !== "loi_accepted" && deal.status !== "payment_pending") {
    return NextResponse.json({ error: "Terms must be accepted before payment." }, { status: 400 });
  }

  if (deal.agreed_price_gbp > maxDealPence()) {
    return NextResponse.json(
      { error: `Purchases above ${formatPence(maxDealPence())} cannot be paid through the site yet.` },
      { status: 400 },
    );
  }

  // Resume an open checkout instead of creating a second one, so a buyer can
  // never end up paying twice for the same deal.
  if (deal.status === "payment_pending" && deal.stripe_checkout_session_id) {
    const existing = await stripeClient().checkout.sessions.retrieve(deal.stripe_checkout_session_id);

    if (existing.status === "open" && existing.url) {
      return NextResponse.json({ url: existing.url });
    }

    if (existing.status === "complete") {
      return NextResponse.json({ error: "Your payment is being confirmed. Check back shortly." }, { status: 409 });
    }
  }

  const { data: seller } = await admin
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", deal.seller_id)
    .single();

  if (!seller?.stripe_connect_account_id || !(await checkSellerOnboarded(seller.stripe_connect_account_id))) {
    return NextResponse.json(
      { error: "The seller has not finished payment setup yet. Ask them to complete it from their dashboard." },
      { status: 409 },
    );
  }

  const { data: listing } = await admin
    .from("listings")
    .select("category_label, project_name, is_anonymous")
    .eq("id", deal.listing_id)
    .single();

  const session = await createDealCheckoutSession({
    dealId: deal.id,
    buyerId: user.id,
    buyerEmail: user.email ?? "",
    amountPence: deal.agreed_price_gbp,
    description: `Software project purchase: ${listing ? listingDisplayTitle(listing) : "listing"}`,
  });

  const { data: updated } = await admin
    .from("deals")
    .update({ status: "payment_pending", stripe_checkout_session_id: session.id })
    .eq("id", deal.id)
    .in("status", ["loi_accepted", "payment_pending"])
    .select("id")
    .maybeSingle();

  if (!updated || !session.url) {
    await stripeClient().checkout.sessions.expire(session.id).catch(() => undefined);
    return NextResponse.json({ error: "Unable to start payment. Refresh and try again." }, { status: 409 });
  }

  await logAction(user.id, "deal_payment_initiated", "deal", deal.id, {
    checkout_session_id: session.id,
    amount_pence: deal.agreed_price_gbp,
  });

  return NextResponse.json({ url: session.url });
}
