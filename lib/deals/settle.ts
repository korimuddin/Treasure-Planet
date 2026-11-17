import type { SupabaseClient } from "@supabase/supabase-js";
import { platformFeePence } from "@/lib/deals/money";
import { chargeIdForPaymentIntent, refundBuyer, releaseToSeller } from "@/lib/stripe/connect";
import type { Database, Deal, DealStatus } from "@/types/database";

type Admin = SupabaseClient<Database>;
type Result = { deal: Deal; error?: undefined } | { deal?: undefined; error: string; status: number };

/**
 * Pays the seller (price minus platform fee) and completes the deal.
 *
 * The deal row is claimed first with a status-guarded update, so two
 * simultaneous calls cannot both proceed; the Stripe transfer also carries an
 * idempotency key. If Stripe refuses, the claim is rolled back.
 */
export async function releaseDeal(admin: Admin, dealId: string, from: DealStatus[]): Promise<Result> {
  const { data: current } = await admin.from("deals").select("*").eq("id", dealId).single();

  if (!current || !from.includes(current.status)) {
    return { error: "This deal is not ready for payout.", status: 409 };
  }

  if (!current.stripe_payment_intent_id) {
    return { error: "No payment is held for this deal.", status: 409 };
  }

  const { data: seller } = await admin
    .from("profiles")
    .select("stripe_connect_account_id")
    .eq("id", current.seller_id)
    .single();

  if (!seller?.stripe_connect_account_id) {
    return { error: "The seller has not finished payment setup.", status: 409 };
  }

  const completedAt = new Date().toISOString();
  const { data: claimed } = await admin
    .from("deals")
    .update({ status: "completed", completed_at: completedAt })
    .eq("id", dealId)
    .eq("status", current.status)
    .select("*")
    .maybeSingle();

  if (!claimed) {
    return { error: "This deal was updated by someone else. Refresh and try again.", status: 409 };
  }

  const fee = platformFeePence(claimed.agreed_price_gbp);

  try {
    const chargeId =
      claimed.stripe_charge_id ?? (await chargeIdForPaymentIntent(current.stripe_payment_intent_id));

    if (!chargeId) {
      throw new Error("Payment has no settled charge yet.");
    }

    const transfer = await releaseToSeller({
      dealId,
      chargeId,
      sellerAccountId: seller.stripe_connect_account_id,
      amountPence: claimed.agreed_price_gbp - fee,
    });

    const { data: finished } = await admin
      .from("deals")
      .update({ stripe_transfer_id: transfer.id, stripe_charge_id: chargeId, platform_fee_gbp: fee })
      .eq("id", dealId)
      .select("*")
      .single();

    await admin.from("listings").update({ status: "sold", sold_at: completedAt }).eq("id", claimed.listing_id);
    await bumpDealCount(admin, claimed.buyer_id);
    await bumpDealCount(admin, claimed.seller_id);

    return { deal: finished ?? claimed };
  } catch {
    await admin
      .from("deals")
      .update({ status: current.status, completed_at: null })
      .eq("id", dealId)
      .eq("status", "completed");

    return { error: "Stripe could not send the payout. Nothing was paid; try again shortly.", status: 502 };
  }
}

/** Returns the whole payment to the buyer and cancels the deal. Same claim-then-act pattern as releaseDeal. */
export async function refundDeal(admin: Admin, dealId: string, from: DealStatus[]): Promise<Result> {
  const { data: current } = await admin.from("deals").select("*").eq("id", dealId).single();

  if (!current || !from.includes(current.status)) {
    return { error: "This deal cannot be refunded in its current state.", status: 409 };
  }

  if (!current.stripe_payment_intent_id) {
    return { error: "No payment is held for this deal.", status: 409 };
  }

  const refundedAt = new Date().toISOString();
  const { data: claimed } = await admin
    .from("deals")
    .update({ status: "cancelled", refunded_at: refundedAt })
    .eq("id", dealId)
    .eq("status", current.status)
    .select("*")
    .maybeSingle();

  if (!claimed) {
    return { error: "This deal was updated by someone else. Refresh and try again.", status: 409 };
  }

  try {
    await refundBuyer(dealId, current.stripe_payment_intent_id);
    await admin.from("listings").update({ status: "live" }).eq("id", claimed.listing_id).eq("status", "under_offer");
    return { deal: claimed };
  } catch {
    await admin
      .from("deals")
      .update({ status: current.status, refunded_at: null })
      .eq("id", dealId)
      .eq("status", "cancelled");

    return { error: "Stripe could not process the refund. Nothing was refunded; try again shortly.", status: 502 };
  }
}

async function bumpDealCount(admin: Admin, userId: string) {
  const { data } = await admin.from("profiles").select("deal_count").eq("id", userId).single();
  await admin
    .from("profiles")
    .update({ deal_count: (data?.deal_count ?? 0) + 1 })
    .eq("id", userId);
}
