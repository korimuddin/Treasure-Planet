import { redirect } from "next/navigation";
import { BuyerDashboardClient } from "@/components/dashboard/BuyerDashboardClient";
import { listingDisplayTitle } from "@/lib/listings/access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BuyerDashboardPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // The user's own rows, read through their RLS-limited session.
  const [{ data: profile }, { data: ndaRequests }, { data: deals }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("nda_requests").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("deals").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
  ]);

  // Listing titles need the service role (a listing under offer or sold is no
  // longer publicly readable). Scoped strictly to listings this buyer already
  // has a request or deal on; the real name is shown only once approved.
  const approved = new Set((ndaRequests ?? []).filter((r) => r.status === "approved").map((r) => r.listing_id));
  const listingIds = Array.from(
    new Set([...(ndaRequests ?? []).map((r) => r.listing_id), ...(deals ?? []).map((d) => d.listing_id)]),
  );
  const { data: listings } = listingIds.length
    ? await createAdminClient()
        .from("listings")
        .select("id, category_label, project_name, is_anonymous, asking_price_gbp")
        .in("id", listingIds)
    : { data: [] };
  const titleMap = new Map(
    (listings ?? []).map((listing) => [
      listing.id,
      approved.has(listing.id) && listing.project_name ? listing.project_name : listingDisplayTitle(listing),
    ]),
  );
  const priceMap = new Map((listings ?? []).map((listing) => [listing.id, listing.asking_price_gbp]));
  const ndaMap = new Map((ndaRequests ?? []).map((request) => [request.id, request.status]));

  return (
    <BuyerDashboardClient
      buyerName={profile?.full_name ?? user.email ?? "Buyer"}
      currentUserId={user.id}
      emailConfirmed={Boolean(user.email_confirmed_at)}
      ndaRequests={(ndaRequests ?? []).map((request) => ({
        ...request,
        listingTitle: titleMap.get(request.listing_id) ?? "Listing",
        askingPrice: priceMap.get(request.listing_id) ?? 0,
      }))}
      deals={(deals ?? []).map((deal) => ({
        ...deal,
        listingTitle: titleMap.get(deal.listing_id) ?? "Deal",
        ndaApproved: deal.nda_request_id ? ndaMap.get(deal.nda_request_id) === "approved" : false,
      }))}
    />
  );
}
