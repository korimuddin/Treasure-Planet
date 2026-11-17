import type Stripe from "stripe";
import { logAction } from "@/lib/compliance/audit";
import { escapeHtml, sendEmail } from "@/lib/email/notifications";
import { accountCanReceive, stripeClient } from "@/lib/stripe/connect";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Admin = ReturnType<typeof createAdminClient>;

const adminEmail = () => process.env.TREASURE_PLANET_ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL;

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return Response.json({ error: "Stripe webhook is not configured." }, { status: 500 });
  }

  if (!signature) {
    return Response.json({ error: "Missing Stripe signature." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripeClient().webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch {
    return Response.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object;
      // "completed" can arrive before a bank payment has actually settled.
      if (session.payment_status === "paid") {
        await markPaymentHeld(supabase, session);
      }
      break;
    }

    case "checkout.session.async_payment_failed":
    case "checkout.session.expired": {
      const session = event.data.object;
      await supabase
        .from("deals")
        .update({ status: "loi_accepted", stripe_checkout_session_id: null })
        .eq("stripe_checkout_session_id", session.id)
        .eq("status", "payment_pending");
      break;
    }

    case "charge.dispute.created": {
      // A card chargeback. Freeze the deal if the money has not gone out yet.
      const dispute = event.data.object;
      const paymentIntentId =
        typeof dispute.payment_intent === "string" ? dispute.payment_intent : dispute.payment_intent?.id;

      if (paymentIntentId) {
        const { data: deal } = await supabase
          .from("deals")
          .update({
            status: "disputed",
            disputed_at: new Date().toISOString(),
            dispute_reason: `Card chargeback opened (${dispute.reason}).`,
          })
          .eq("stripe_payment_intent_id", paymentIntentId)
          .in("status", ["in_escrow", "ip_transferred"])
          .select("id")
          .maybeSingle();

        await sendEmail({
          to: adminEmail(),
          subject: "Card chargeback opened",
          html: `<p>A chargeback was opened on payment ${escapeHtml(paymentIntentId)}${deal ? ` (deal ${escapeHtml(deal.id)}, now frozen)` : " (deal already settled or not found)"}. Respond in the Stripe dashboard.</p>`,
        }).catch(() => undefined);
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;
      // Column name is historical: it now records "can receive transfers and payouts".
      await supabase
        .from("profiles")
        .update({ stripe_connect_charges_enabled: accountCanReceive(account) })
        .eq("stripe_connect_account_id", account.id);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}

async function markPaymentHeld(supabase: Admin, session: Stripe.Checkout.Session) {
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("stripe_checkout_session_id", session.id)
    .maybeSingle();

  // Unknown session, or this event was already processed (Stripe retries).
  if (!deal || deal.status !== "payment_pending") {
    return;
  }

  // The amount paid must be exactly the agreed price. If not, freeze for review.
  const amountMatches = session.amount_total === deal.agreed_price_gbp && session.currency === "gbp";

  const { data: updated } = await supabase
    .from("deals")
    .update({
      status: amountMatches ? "in_escrow" : "disputed",
      stripe_payment_intent_id: paymentIntentId,
      payment_made_at: new Date().toISOString(),
      ...(amountMatches
        ? {}
        : { disputed_at: new Date().toISOString(), dispute_reason: "Amount paid did not match the agreed price." }),
    })
    .eq("id", deal.id)
    .eq("status", "payment_pending")
    .select("*")
    .maybeSingle();

  if (!updated) {
    return;
  }

  await logAction(deal.buyer_id, "deal_payment_held", "deal", deal.id, {
    payment_intent_id: paymentIntentId,
    amount_pence: session.amount_total,
    amount_matches: amountMatches,
  });

  if (!amountMatches) {
    await sendEmail({
      to: adminEmail(),
      subject: "Payment amount mismatch",
      html: `<p>Deal ${escapeHtml(deal.id)} received a payment that does not match its agreed price. It has been frozen.</p>`,
    }).catch(() => undefined);
    return;
  }

  const [{ data: buyer }, { data: seller }] = await Promise.all([
    supabase.from("profiles").select("email").eq("id", deal.buyer_id).single(),
    supabase.from("profiles").select("email").eq("id", deal.seller_id).single(),
  ]);

  await Promise.all([
    sendEmail({
      to: buyer?.email,
      subject: "Payment received and held",
      html: "<p>Your payment has been received. It is held by our payment provider, Stripe, and is only released to the seller when you confirm you have received the project.</p>",
    }),
    sendEmail({
      to: seller?.email,
      subject: "The buyer has paid - transfer the project",
      html: "<p>The buyer's payment has been received and is being held. Transfer the project to the buyer, then mark it as transferred from your dashboard. You are paid when the buyer confirms receipt.</p>",
    }),
  ]).catch(() => undefined);
}
