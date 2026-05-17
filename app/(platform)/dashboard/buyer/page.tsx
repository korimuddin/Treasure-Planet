import { redirect } from "next/navigation";
import { BuyerDashboardClient } from "@/components/dashboard/BuyerDashboardClient";
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

  const [{ data: profile }, { data: ndaRequests }, { data: deals }] = await Promise.all([
    supabase.from("profiles").select("full_name, role").eq("id", user.id).single(),
    supabase.from("nda_requests").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("deals").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false }),
  ]);

  const listingIds = Array.from(new Set((deals ?? []).map((deal) => deal.listing_id)));
  const { data: listings } = listingIds.length
    ? await supabase.from("listings").select("id, category_label").in("id", listingIds)
    : { data: [] };
  const listingMap = new Map((listings ?? []).map((listing) => [listing.id, listing.category_label]));
  const ndaMap = new Map((ndaRequests ?? []).map((request) => [request.id, request.status]));

  return (
    <BuyerDashboardClient
      buyerName={profile?.full_name ?? user.email ?? "Buyer"}
      currentUserId={user.id}
      ndaRequests={ndaRequests ?? []}
      deals={(deals ?? []).map((deal) => ({
        ...deal,
        listingTitle: listingMap.get(deal.listing_id) ?? "Deal",
        ndaApproved: deal.nda_request_id ? ndaMap.get(deal.nda_request_id) === "approved" : false,
      }))}
    />
  );
}
