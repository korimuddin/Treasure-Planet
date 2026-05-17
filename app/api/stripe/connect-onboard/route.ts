import { NextResponse } from "next/server";
import { createConnectAccount, createOnboardingLink } from "@/lib/stripe/connect";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email, stripe_connect_account_id")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller") {
    return NextResponse.json({ error: "Only sellers can onboard for payments." }, { status: 403 });
  }

  let accountId = profile.stripe_connect_account_id;

  if (!accountId) {
    const account = await createConnectAccount(profile.email ?? user.email ?? "", user.id);
    accountId = account.id;
    await supabase
      .from("profiles")
      .update({
        stripe_connect_account_id: accountId,
        stripe_connect_charges_enabled: Boolean(account.charges_enabled),
      })
      .eq("id", user.id);
  }

  const link = await createOnboardingLink(accountId, user.id);
  return NextResponse.json({ url: link.url });
}
