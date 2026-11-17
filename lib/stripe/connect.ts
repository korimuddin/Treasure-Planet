import Stripe from "stripe";
import { cardCapPence } from "@/lib/deals/money";

/**
 * Money flow ("separate charges and transfers"):
 *
 *   1. Buyer pays the full price through Stripe Checkout. The charge lands on
 *      the PLATFORM's Stripe balance. Nothing is sent to the seller yet.
 *   2. Seller hands over the project, buyer confirms receipt.
 *   3. releaseToSeller() transfers price minus platform fee to the seller's
 *      connected account. The fee simply stays on the platform balance.
 *   4. If the deal falls through before release, refundBuyer() returns the
 *      whole payment.
 *
 * Stripe holds the funds throughout. Stripe does not provide escrow services,
 * so the product must never describe this as "escrow".
 */

export function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured.");
  }

  return new Stripe(secretKey);
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function createConnectAccount(sellerEmail: string, sellerId: string) {
  return stripeClient().accounts.create({
    type: "express",
    country: "GB",
    email: sellerEmail,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: {
      seller_id: sellerId,
    },
  });
}

export async function createOnboardingLink(accountId: string) {
  return stripeClient().accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl()}/dashboard/seller?stripe=refresh`,
    return_url: `${appUrl()}/dashboard/seller?stripe=return`,
    type: "account_onboarding",
  });
}

/** True once Stripe has verified the seller and they can receive transfers and payouts. */
export function accountCanReceive(account: Stripe.Account) {
  return account.capabilities?.transfers === "active" && Boolean(account.payouts_enabled);
}

export async function checkSellerOnboarded(accountId: string) {
  return accountCanReceive(await stripeClient().accounts.retrieve(accountId));
}

export function transferGroup(dealId: string) {
  return `deal_${dealId}`;
}

export async function createDealCheckoutSession(params: {
  dealId: string;
  buyerId: string;
  buyerEmail: string;
  amountPence: number;
  description: string;
}) {
  // Pay by Bank has no chargebacks. Cards are only offered for small deals.
  const paymentMethodTypes: Array<"pay_by_bank" | "card"> =
    params.amountPence <= cardCapPence() ? ["pay_by_bank", "card"] : ["pay_by_bank"];

  return stripeClient().checkout.sessions.create({
    mode: "payment",
    payment_method_types: paymentMethodTypes,
    customer_email: params.buyerEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "gbp",
          unit_amount: params.amountPence,
          product_data: { name: params.description },
        },
      },
    ],
    payment_intent_data: {
      transfer_group: transferGroup(params.dealId),
      metadata: { deal_id: params.dealId, buyer_id: params.buyerId },
    },
    metadata: { deal_id: params.dealId, buyer_id: params.buyerId },
    success_url: `${appUrl()}/dashboard/buyer?payment=success`,
    cancel_url: `${appUrl()}/dashboard/buyer?payment=cancelled`,
  });
}

/** Resolves the charge behind a paid PaymentIntent (needed as the transfer's source). */
export async function chargeIdForPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripeClient().paymentIntents.retrieve(paymentIntentId);
  const charge = paymentIntent.latest_charge;
  return typeof charge === "string" ? charge : (charge?.id ?? null);
}

export async function releaseToSeller(params: {
  dealId: string;
  chargeId: string;
  sellerAccountId: string;
  amountPence: number;
}) {
  return stripeClient().transfers.create(
    {
      amount: params.amountPence,
      currency: "gbp",
      destination: params.sellerAccountId,
      // Ties the transfer to the buyer's payment so it can go out even while
      // that payment is still settling, and can never exceed it.
      source_transaction: params.chargeId,
      transfer_group: transferGroup(params.dealId),
      metadata: { deal_id: params.dealId },
    },
    // A retry or double-click can never pay the seller twice.
    { idempotencyKey: `release_${params.dealId}` },
  );
}

export async function refundBuyer(dealId: string, paymentIntentId: string) {
  return stripeClient().refunds.create(
    { payment_intent: paymentIntentId, metadata: { deal_id: dealId } },
    { idempotencyKey: `refund_${dealId}` },
  );
}
