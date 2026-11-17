import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";

/** Returns the signed-in user's own data as a JSON file download. */
export async function POST() {
  const auth = await requireUser({ allowUnconfirmed: true });
  if (auth.error) return auth.error;
  const { user, profile, admin } = auth;
  const mine = `buyer_id.eq.${user.id},seller_id.eq.${user.id}`;

  const [listings, requests, deals, messages] = await Promise.all([
    admin.from("listings").select("*").eq("seller_id", user.id),
    admin.from("nda_requests").select("*").or(mine),
    admin.from("deals").select("*").or(mine),
    admin.from("messages").select("*").eq("sender_id", user.id),
  ]);

  await logAction(user.id, "gdpr_subject_access_requested", "user", user.id);

  const body = JSON.stringify(
    {
      profile,
      listings: listings.data ?? [],
      access_requests: requests.data ?? [],
      deals: deals.data ?? [],
      messages_sent: messages.data ?? [],
      generated_at: new Date().toISOString(),
    },
    null,
    2,
  );

  return new Response(body, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="treasure-planet-data-export.json"',
      "Cache-Control": "no-store",
    },
  });
}
