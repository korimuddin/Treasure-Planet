import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return Response.json({ error: "Stripe is not configured." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: {
      user_id: user.id,
    },
    return_url: `${appUrl}/dashboard/buyer`,
  });

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      kyc_status: "submitted",
      kyc_session_id: session.id,
    })
    .eq("id", user.id);

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({ client_secret: session.client_secret });
}
