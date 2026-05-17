import Stripe from "stripe";

function stripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("Stripe secret key is not configured.");
  }

  return new Stripe(secretKey);
}

export async function createConnectAccount(sellerEmail: string, sellerId: string) {
  const stripe = stripeClient();

  return stripe.accounts.create({
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

export async function createOnboardingLink(accountId: string, sellerId: string) {
  const stripe = stripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/dashboard/seller?stripe=refresh&seller=${sellerId}`,
    return_url: `${appUrl}/dashboard/seller?stripe=return&seller=${sellerId}`,
    type: "account_onboarding",
  });
}

export async function createDealPaymentIntent(
  amountGbp: number,
  sellerAccountId: string,
  dealId: string,
  buyerId: string,
) {
  const stripe = stripeClient();

  return stripe.paymentIntents.create({
    amount: amountGbp,
    currency: "gbp",
    payment_method_types: ["card"],
    transfer_data: {
      destination: sellerAccountId,
    },
    application_fee_amount: Math.round(amountGbp * 0.1),
    capture_method: "manual",
    metadata: {
      deal_id: dealId,
      buyer_id: buyerId,
    },
  });
}

export async function releaseFunds(paymentIntentId: string) {
  const stripe = stripeClient();
  return stripe.paymentIntents.capture(paymentIntentId);
}

export async function checkSellerOnboarded(accountId: string) {
  const stripe = stripeClient();
  const account = await stripe.accounts.retrieve(accountId);
  return Boolean(account.charges_enabled);
}
