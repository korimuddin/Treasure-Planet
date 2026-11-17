import { NextResponse, type NextRequest } from "next/server";
import { filterListingByTier, getListingAccessTier } from "@/lib/listings/access";
import { previewListings } from "@/lib/listings/sample";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ListingNdaStatus } from "@/types/database";

type RouteContext = {
  params: {
    id: string;
  };
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: NextRequest, { params }: RouteContext) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const listing = previewListings.find((item) => item.id === params.id);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found." }, { status: 404 });
    }

    return NextResponse.json({
      listing: filterListingByTier(listing, "public"),
      ndaStatus: null,
      accessTier: "public",
    });
  }

  if (!uuid.test(params.id)) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  const {
    data: { user },
  } = await createClient().auth.getUser();
  const admin = createAdminClient();
  const { data: listing } = await admin.from("listings").select("*").eq("id", params.id).single();

  if (!listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  let ndaStatus: ListingNdaStatus | null = null;

  if (user) {
    const { data: access } = await admin
      .from("listing_nda_access")
      .select("status")
      .eq("listing_id", listing.id)
      .eq("user_id", user.id)
      .maybeSingle();

    ndaStatus = access?.status ?? null;
  }

  const accessTier = getListingAccessTier(listing, user?.id, ndaStatus);

  // Drafts and withdrawn listings are visible only to their seller. Listings
  // under offer or sold stay visible to buyers who were granted access.
  const isOwner = user?.id === listing.seller_id;
  const visible = listing.status === "live" || isOwner || (accessTier === "nda" && listing.status !== "draft");

  if (!visible) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  if (!isOwner && listing.status === "live") {
    await admin.rpc("increment_listing_views", { listing_id: listing.id });
  }

  return NextResponse.json({
    listing: filterListingByTier(listing, accessTier),
    ndaStatus,
    accessTier,
  });
}
