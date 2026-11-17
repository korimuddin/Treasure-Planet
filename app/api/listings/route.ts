import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { filterListingByTier, getListingAccessTier } from "@/lib/listings/access";
import { previewListings } from "@/lib/listings/sample";
import { NDA_VERSION } from "@/lib/nda/template";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ListingNdaStatus, ListingPlatform } from "@/types/database";

const platforms = [
  "web",
  "saas",
  "ios",
  "android",
  "macos",
  "windows",
  "ios-gaming",
  "android-gaming",
  "pc-gaming",
] as const;

const jsonRecord = z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()]));

const listingSchema = z.object({
  platform: z.enum(platforms),
  category_label: z.string().min(2).max(80),
  completion_pct: z.number().int().min(0).max(100),
  asking_price_gbp: z.number().int().min(0),
  deal_types: z.array(z.string().max(20)).max(5).default([]),
  tech_stack: z.array(z.string().max(40)).max(20).default([]),
  public_summary: z.string().min(20).max(2000),
  is_anonymous: z.boolean().default(true),
  requires_nda: z.boolean().default(true),
  accept_nda: z.boolean().default(false),
  dev_background: z.string().max(5000).optional().nullable(),
  screenshots_urls: z.array(z.string().max(500)).max(12).default([]),
  demo_video_url: z.string().max(500).optional().nullable(),
  tech_stack_detail: z.string().max(5000).optional().nullable(),
  git_stats: jsonRecord.default({}),
  dev_timeline: z.string().max(5000).optional().nullable(),
  project_name: z.string().max(120).optional().nullable(),
  source_code_url: z.string().max(500).optional().nullable(),
  architecture_doc: z.string().max(20000).optional().nullable(),
  revenue_data: jsonRecord.default({}),
  roadmap: z.string().max(5000).optional().nullable(),
  seller_name: z.string().max(120).optional().nullable(),
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

  const {
    data: { user },
  } = await createClient().auth.getUser();

  // Service-role read of full rows; nothing leaves this function unfiltered.
  const admin = createAdminClient();
  let query = admin.from("listings").select("*").eq("status", "live").order("listed_at", {
    ascending: false,
    nullsFirst: false,
  });

  if (platform) {
    query = query.eq("platform", platform);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Unable to load listings." }, { status: 500 });
  }

  const ndaStatuses = new Map<string, ListingNdaStatus>();

  if (user && data?.length) {
    const { data: accessRows } = await admin
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
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, profile, admin } = auth;

  if (profile.role !== "seller") {
    return NextResponse.json({ error: "Only sellers can create listings." }, { status: 403 });
  }

  const parsed = listingSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { publish, accept_nda: acceptNda, ...listing } = parsed.data;

  if (listing.requires_nda && !acceptNda) {
    return NextResponse.json(
      { error: "Accept the mutual NDA terms, or switch off the NDA requirement for this listing." },
      { status: 400 },
    );
  }

  if (publish && !listing.project_name) {
    return NextResponse.json({ error: "Add a project name before publishing." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("listings")
    .insert({
      ...listing,
      seller_id: user.id,
      seller_nda_version: listing.requires_nda ? NDA_VERSION : null,
      seller_nda_accepted_at: listing.requires_nda ? now : null,
      status: publish ? "live" : "draft",
      listed_at: publish ? now : null,
    })
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Unable to create listing." }, { status: 500 });
  }

  await logAction(user.id, publish ? "listing_published" : "listing_created", "listing", data.id, {
    platform: data.platform,
    status: data.status,
    requires_nda: data.requires_nda,
    is_anonymous: data.is_anonymous,
  });

  return NextResponse.json({ listing: data }, { status: 201 });
}
