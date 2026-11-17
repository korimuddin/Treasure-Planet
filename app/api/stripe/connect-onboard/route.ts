import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createConnectAccount, createOnboardingLink } from "@/lib/stripe/connect";

export const runtime = "nodejs";

export async function POST() {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, profile, admin } = auth;

  if (profile.role !== "seller") {
    return NextResponse.json({ error: "Only sellers can set up payouts." }, { status: 403 });
  }

  let accountId = profile.stripe_connect_account_id;

  if (!accountId) {
    const account = await createConnectAccount(user.email ?? profile.email ?? "", user.id);
    accountId = account.id;
    await admin.from("profiles").update({ stripe_connect_account_id: accountId }).eq("id", user.id);
  }

  const link = await createOnboardingLink(accountId);
  return NextResponse.json({ url: link.url });
}
