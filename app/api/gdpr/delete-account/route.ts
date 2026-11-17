import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { createClient } from "@/lib/supabase/server";

/**
 * Erases the user's personal details and permanently disables sign-in.
 *
 * Deal, signed-NDA and audit rows are kept (they reference the profile id, and
 * the other party needs them), so the profile row is anonymised, not removed.
 * Refused while money is held on one of the user's deals.
 */
export async function POST() {
  const auth = await requireUser({ allowUnconfirmed: true });
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const { data: openDeals } = await admin
    .from("deals")
    .select("id")
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .in("status", ["payment_pending", "in_escrow", "ip_transferred", "disputed"])
    .limit(1);

  if (openDeals?.length) {
    return NextResponse.json(
      { error: "You have a deal with a payment in progress. It must finish before the account can be deleted." },
      { status: 409 },
    );
  }

  const anonymisedEmail = `deleted-${user.id}@deleted.invalid`;

  await admin.from("listings").update({ status: "withdrawn" }).eq("seller_id", user.id).in("status", ["draft", "live"]);

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: "Deleted User",
      email: anonymisedEmail,
      company: null,
      country: null,
      primary_platform: null,
      avatar_initials: "DU",
      suspended_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: "Unable to delete the account." }, { status: 500 });

  // Scrub the login identity too and block it for good.
  await admin.auth.admin.updateUserById(user.id, {
    email: anonymisedEmail,
    user_metadata: {},
    ban_duration: "876000h",
  });

  await logAction(user.id, "gdpr_account_deleted", "user", user.id, {
    retained: ["deal records", "signed NDA records", "audit trail"],
  });
  await createClient().auth.signOut();

  return NextResponse.json({ deleted: true });
}
