import { redirect } from "next/navigation";
import {
  SellerDashboardClient,
  type SellerDealCard,
  type SellerRequestCard,
} from "@/components/dashboard/SellerDashboardClient";
import { createClient } from "@/lib/supabase/server";
import { checkSellerOnboarded } from "@/lib/stripe/connect";
import type { SellerSettings } from "@/types/database";

export const dynamic = "force-dynamic";

const defaultSettings: SellerSettings = {
  seller_id: "",
  auto_approve: false,
  auto_approve_min_budget: 0,
  auto_approve_deal_types: [],
  response_message: "Thank you — you now have full data room access.",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export default async function SellerDashboardPage() {
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

  const [{ data: profile }, { data: listings }, { data: requests }, { data: settings }, { data: deals }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, role, stripe_connect_account_id, stripe_connect_charges_enabled")
      .eq("id", user.id)
      .single(),
    supabase.from("listings").select("id, views_count, category_label").eq("seller_id", user.id),
    supabase.from("nda_requests").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
    supabase.from("seller_settings").select("*").eq("seller_id", user.id).maybeSingle(),
    supabase.from("deals").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
  ]);

  const buyerIds = Array.from(new Set((requests ?? []).map((request) => request.buyer_id)));
  const { data: buyers } = buyerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, company, country, avatar_initials, verified_budget_min, verified_budget_max")
        .in("id", buyerIds)
    : { data: [] };

  const listingMap = new Map((listings ?? []).map((listing) => [listing.id, listing]));
  const buyerMap = new Map((buyers ?? []).map((buyer) => [buyer.id, buyer]));
  const cards: SellerRequestCard[] = (requests ?? []).map((request) => {
    const buyer = buyerMap.get(request.buyer_id);
    const listing = listingMap.get(request.listing_id);

    return {
      id: request.id,
      status: request.status,
      buyerName: buyer?.full_name ?? buyer?.email ?? "Verified buyer",
      buyerInitials: buyer?.avatar_initials ?? initialsFromName(buyer?.full_name ?? buyer?.email ?? "VB"),
      company: buyer?.company ?? "Independent buyer",
      country: buyer?.country ?? "Location pending",
      dealType: request.deal_type,
      budgetMin: request.budget_min_gbp ?? buyer?.verified_budget_min ?? 0,
      budgetMax: request.budget_max_gbp ?? buyer?.verified_budget_max ?? 0,
      message: request.message ?? "No buyer message supplied.",
      listingTitle: listing?.category_label ?? "Listing",
    };
  });

  const stats = {
    views: (listings ?? []).reduce((sum, listing) => sum + listing.views_count, 0),
    requests: requests?.length ?? 0,
    approved: requests?.filter((request) => request.status === "approved").length ?? 0,
    awaitingReview: requests?.filter((request) => request.status === "pending_review").length ?? 0,
  };
  const ndaMap = new Map((requests ?? []).map((request) => [request.id, request.status]));
  const dealCards: SellerDealCard[] = (deals ?? []).map((deal) => ({
    ...deal,
    listingTitle: listingMap.get(deal.listing_id)?.category_label ?? "Deal",
    ndaApproved: deal.nda_request_id ? ndaMap.get(deal.nda_request_id) === "approved" : false,
  }));
  let stripeOnboarded = Boolean(profile?.stripe_connect_charges_enabled);

  if (!stripeOnboarded && profile?.stripe_connect_account_id && process.env.STRIPE_SECRET_KEY) {
    try {
      stripeOnboarded = await checkSellerOnboarded(profile.stripe_connect_account_id);
    } catch {
      stripeOnboarded = false;
    }
  }

  return (
    <SellerDashboardClient
      sellerName={profile?.full_name ?? user.email ?? "Seller"}
      currentUserId={user.id}
      stats={stats}
      requests={cards}
      settings={settings ?? { ...defaultSettings, seller_id: user.id }}
      needsPaymentSetup={!profile?.stripe_connect_account_id || !stripeOnboarded}
      deals={dealCards}
    />
  );
}

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
