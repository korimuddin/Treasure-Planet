import type { Listing, ListingNdaStatus } from "@/types/database";

export type AccessTier = "public" | "registered" | "nda";

const publicColumns = [
  "id",
  "seller_id",
  "platform",
  "category_label",
  "completion_pct",
  "asking_price_gbp",
  "deal_types",
  "tech_stack",
  "public_summary",
  "status",
  "is_anonymous",
  "views_count",
  "created_at",
  "updated_at",
  "listed_at",
  "sold_at",
] as const;

const registeredColumns = [
  "dev_background",
  "screenshots_urls",
  "demo_video_url",
  "tech_stack_detail",
  "git_stats",
  "dev_timeline",
] as const;

export type FilteredListing = Partial<Listing> & Pick<Listing, (typeof publicColumns)[number]>;

export function getListingAccessTier(
  listing: Pick<Listing, "seller_id">,
  userId?: string | null,
  ndaStatus?: ListingNdaStatus | null,
): AccessTier {
  if (userId && (ndaStatus === "approved" || listing.seller_id === userId)) {
    return "nda";
  }

  if (userId) {
    return "registered";
  }

  return "public";
}

export function filterListingByTier(listing: Listing, tier: AccessTier): FilteredListing {
  const filtered = pick(listing, publicColumns) as FilteredListing;

  if (tier === "registered" || tier === "nda") {
    Object.assign(filtered, pick(listing, registeredColumns));
  }

  if (tier === "nda") {
    Object.assign(filtered, {
      project_name: listing.project_name,
      source_code_url: listing.source_code_url,
      architecture_doc: listing.architecture_doc,
      revenue_data: listing.revenue_data,
      roadmap: listing.roadmap,
      seller_name: listing.seller_name,
    });
  }

  return filtered;
}

function pick<T extends object, K extends readonly (keyof T)[]>(source: T, keys: K): Pick<T, K[number]> {
  return keys.reduce((result, key) => {
    result[key] = source[key];
    return result;
  }, {} as Pick<T, K[number]>);
}
