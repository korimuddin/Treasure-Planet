import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/compliance/audit";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  const anonymisedEmail = `deleted-${createHash("sha256").update(user.id).digest("hex").slice(0, 16)}@deleted.treasureplanet.local`;
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: "Deleted User",
      email: anonymisedEmail,
      company: null,
      country: null,
      avatar_initials: "DU",
      sanctions_flagged: false,
    })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAction(user.id, "gdpr_account_deleted", "user", user.id, {
    retained: ["deal records", "NDA timestamps", "audit trail"],
    retention: "7 years where legally required",
  });
  await supabase.auth.signOut();

  return NextResponse.json({ deleted: true });
}
