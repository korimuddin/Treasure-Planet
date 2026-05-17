import { NextResponse, type NextRequest } from "next/server";
import { filterListingByTier, getListingAccessTier } from "@/lib/listings/access";
import { previewListings } from "@/lib/listings/sample";
import { createClient } from "@/lib/supabase/server";
import type { ListingNdaStatus } from "@/types/database";

type RouteContext = {
  params: {
    id: string;
  };
};

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

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: listing, error } = await supabase.from("listings").select("*").eq("id", params.id).single();

  if (error || !listing) {
    return NextResponse.json({ error: "Listing not found." }, { status: 404 });
  }

  let ndaStatus: ListingNdaStatus | null = null;

  if (user) {
    const { data: access } = await supabase
      .from("listing_nda_access")
      .select("status")
      .eq("listing_id", listing.id)
      .eq("user_id", user.id)
      .maybeSingle();

    ndaStatus = access?.status ?? null;
  }

  const accessTier = getListingAccessTier(listing, user?.id, ndaStatus);

  return NextResponse.json({
    listing: filterListingByTier(listing, accessTier),
    ndaStatus,
    accessTier,
  });
}
