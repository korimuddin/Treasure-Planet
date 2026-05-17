import Stripe from "stripe";
import { screenUser } from "@/lib/compliance/sanctions";
import { sendEmail } from "@/lib/email/notifications";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!stripeSecretKey || !webhookSecret) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (
    event.type === "identity.verification_session.verified" ||
    event.type === "identity.verification_session.requires_input"
  ) {
    const session = event.data.object as Stripe.Identity.VerificationSession;
    const kycStatus = event.type === "identity.verification_session.verified" ? "verified" : "failed";
    const userId = session.metadata?.user_id;

    const query = userId
      ? supabase.from("profiles").update({ kyc_status: kycStatus }).eq("id", userId)
      : supabase.from("profiles").update({ kyc_status: kycStatus }).eq("kyc_session_id", session.id);

    const { error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (kycStatus === "verified" && userId) {
      const { data: profile } = await supabase.from("profiles").select("full_name, country").eq("id", userId).single();
      await screenUser(userId, profile?.full_name, profile?.country);
    }
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const dealId = paymentIntent.metadata?.deal_id;

    if (dealId) {
      const { data: deal } = await supabase
        .from("deals")
        .update({
          payment_made_at: new Date().toISOString(),
        })
        .eq("id", dealId)
        .select("*")
        .single();

      if (deal) {
        const [{ data: buyer }, { data: seller }] = await Promise.all([
          supabase.from("profiles").select("email, full_name").eq("id", deal.buyer_id).single(),
          supabase.from("profiles").select("email, full_name").eq("id", deal.seller_id).single(),
        ]);

        await Promise.all([
          sendEmail({
            to: buyer?.email,
            subject: "Escrow payment confirmed",
            html: `<p>Your escrow payment has been confirmed for deal ${deal.id}.</p>`,
          }),
          sendEmail({
            to: seller?.email,
            subject: "Escrow payment confirmed",
            html: `<p>The buyer's escrow payment has been confirmed for deal ${deal.id}.</p>`,
          }),
        ]);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const dealId = paymentIntent.metadata?.deal_id;

    if (dealId) {
      const { data: deal } = await supabase
        .from("deals")
        .update({
          status: "loi_accepted",
          stripe_payment_intent_id: null,
        })
        .eq("id", dealId)
        .select("*")
        .single();

      if (deal) {
        const { data: buyer } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", deal.buyer_id)
          .single();

        await sendEmail({
          to: buyer?.email,
          subject: "Payment attempt failed",
          html: `<p>Your escrow payment could not be completed. You can try again from your deal dashboard.</p>`,
        });
      }
    }
  }

  if (event.type === "account.updated") {
    const account = event.data.object as Stripe.Account;
    const sellerId = account.metadata?.seller_id;
    const query = sellerId
      ? supabase
          .from("profiles")
          .update({
            stripe_connect_account_id: account.id,
            stripe_connect_charges_enabled: Boolean(account.charges_enabled),
          })
          .eq("id", sellerId)
      : supabase
          .from("profiles")
          .update({
            stripe_connect_charges_enabled: Boolean(account.charges_enabled),
          })
          .eq("stripe_connect_account_id", account.id);

    const { error } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
