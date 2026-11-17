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
  "requires_nda",
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

/** The name safe to show this viewer: the real name only if public or unlocked. */
export function listingDisplayTitle(listing: Pick<Listing, "is_anonymous" | "project_name" | "category_label">) {
  return !listing.is_anonymous && listing.project_name ? listing.project_name : listing.category_label;
}

export function filterListingByTier(listing: Listing, tier: AccessTier): FilteredListing {
  const filtered = pick(listing, publicColumns) as FilteredListing;

  if (tier === "registered" || tier === "nda") {
    Object.assign(filtered, pick(listing, registeredColumns));
  }

  // A seller who chose not to be anonymous shows the project and their name publicly.
  if (!listing.is_anonymous) {
    Object.assign(filtered, {
      project_name: listing.project_name,
      seller_name: listing.seller_name,
    });
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
