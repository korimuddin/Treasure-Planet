import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { logAction } from "@/lib/compliance/audit";
import { sendEmail } from "@/lib/email/notifications";
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

  const [profile, listings, ndaBuyer, ndaSeller, dealsBuyer, dealsSeller] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("listings").select("*").eq("seller_id", user.id),
    supabase.from("nda_requests").select("*").eq("buyer_id", user.id),
    supabase.from("nda_requests").select("*").eq("seller_id", user.id),
    supabase.from("deals").select("*").eq("buyer_id", user.id),
    supabase.from("deals").select("*").eq("seller_id", user.id),
  ]);

  const exportData = {
    profile: profile.data,
    listings: listings.data ?? [],
    nda_requests: [...(ndaBuyer.data ?? []), ...(ndaSeller.data ?? [])],
    deals: [...(dealsBuyer.data ?? []), ...(dealsSeller.data ?? [])],
    generated_at: new Date().toISOString(),
  };
  const json = JSON.stringify(exportData, null, 2);
  const token = createHash("sha256").update(`${user.id}:${Date.now()}`).digest("hex").slice(0, 16);
  const downloadLink = `data:application/json;charset=utf-8,${encodeURIComponent(json)}`;

  await sendEmail({
    to: user.email,
    subject: "Your Treasure Planet data export",
    html: `<p>Your subject access request is ready.</p><p><a href="${downloadLink}" download="treasure-planet-${token}.json">Download JSON export</a></p>`,
  });
  await logAction(user.id, "gdpr_subject_access_requested", "user", user.id);

  return NextResponse.json({ sent: true });
}
