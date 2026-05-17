import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { filterListingByTier, getListingAccessTier } from "@/lib/listings/access";
import { previewListings } from "@/lib/listings/sample";
import { createClient } from "@/lib/supabase/server";
import type { ListingNdaStatus, ListingPlatform } from "@/types/database";

const listingSchema = z.object({
  platform: z.enum(["ios", "android", "macos", "windows", "ios-gaming", "android-gaming", "pc-gaming"]),
  category_label: z.string().min(2),
  completion_pct: z.number().int().min(0).max(100),
  asking_price_gbp: z.number().int().min(0),
  deal_types: z.array(z.string()).default([]),
  tech_stack: z.array(z.string()).default([]),
  public_summary: z.string().min(20),
  is_anonymous: z.boolean().default(true),
  dev_background: z.string().optional().nullable(),
  screenshots_urls: z.array(z.string()).default([]),
  demo_video_url: z.string().optional().nullable(),
  tech_stack_detail: z.string().optional().nullable(),
  git_stats: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  dev_timeline: z.string().optional().nullable(),
  project_name: z.string().optional().nullable(),
  source_code_url: z.string().optional().nullable(),
  architecture_doc: z.string().optional().nullable(),
  revenue_data: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).default({}),
  roadmap: z.string().optional().nullable(),
  seller_name: z.string().optional().nullable(),
  publish: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  const platform = request.nextUrl.searchParams.get("platform") as ListingPlatform | null;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const listings = previewListings
      .filter((listing) => !platform || listing.platform === platform)
      .map((listing) => filterListingByTier(listing, "public"));

    return NextResponse.json({ listings, total: listings.length });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase.from("listings").select("*").eq("status", "live").order("listed_at", {
    ascending: false,
    nullsFirst: false,
  });

  if (platform) {
    query = query.eq("platform", platform);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await Promise.all(
    (data ?? []).map((listing) => supabase.rpc("increment_listing_views", { listing_id: listing.id })),
  );

  const ndaStatuses = new Map<string, ListingNdaStatus>();

  if (user && data?.length) {
    const { data: accessRows } = await supabase
      .from("listing_nda_access")
      .select("listing_id, status")
      .eq("user_id", user.id)
      .in(
        "listing_id",
        data.map((listing) => listing.id),
      );

    accessRows?.forEach((row) => ndaStatuses.set(row.listing_id, row.status));
  }

  const listings = (data ?? []).map((listing) => {
    const tier = getListingAccessTier(listing, user?.id, ndaStatuses.get(listing.id) ?? null);
    return filterListingByTier(listing, tier);
  });

  return NextResponse.json({ listings, total: listings.length });
}

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, kyc_status")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 403 });
  }

  if (profile.role !== "seller") {
    return NextResponse.json({ error: "Only sellers can create listings." }, { status: 403 });
  }

  if (profile.kyc_status !== "verified") {
    return NextResponse.json({ error: "KYC verification is required before listing." }, { status: 403 });
  }

  const parsed = listingSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { publish, ...listing } = parsed.data;
  const { data, error } = await supabase
    .from("listings")
    .insert({
      ...listing,
      seller_id: user.id,
      status: publish ? "live" : "draft",
      listed_at: publish ? new Date().toISOString() : null,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAction(user.id, publish ? "listing_published" : "listing_created", "listing", data.id, {
    platform: data.platform,
    status: data.status,
  });

  return NextResponse.json({ listing: data }, { status: 201 });
}
