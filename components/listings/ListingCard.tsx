import Link from "next/link";
import type { FilteredListing, AccessTier } from "@/lib/listings/access";
import type { ListingPlatform } from "@/types/database";

const platformStyles: Record<ListingPlatform, { label: string; color: string }> = {
  ios: { label: "iOS", color: "#85B7EB" },
  android: { label: "Android", color: "#3DB890" },
  macos: { label: "macOS", color: "#C9A0FF" },
  windows: { label: "Windows", color: "#F0A85A" },
  "ios-gaming": { label: "iOS Gaming", color: "#E0845A" },
  "android-gaming": { label: "Android Gaming", color: "#E0845A" },
  "pc-gaming": { label: "PC Gaming", color: "#E0845A" },
};

export function ListingCard({
  listing,
  accessTier = "public",
}: {
  listing: FilteredListing;
  accessTier?: AccessTier;
}) {
  const platform = platformStyles[listing.platform];
  const price = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(listing.asking_price_gbp / 100);
  const listedAt = listing.listed_at
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(
        new Date(listing.listed_at),
      )
    : "Draft";
  const isNdaTier = accessTier === "nda";
  const displayName = isNdaTier && listing.project_name ? listing.project_name : "Anonymous project";

  return (
    <article className="group relative grid gap-6 overflow-hidden border border-border bg-[rgba(7,15,26,0.88)] p-5 transition hover:border-border2 hover:bg-[rgba(7,15,26,0.96)] lg:grid-cols-[1fr_220px]">
      <div className="absolute left-0 top-0 h-full w-0.5 bg-gold opacity-0 transition group-hover:opacity-100" />
      {listing.views_count > 400 && (
        <div className="absolute right-4 top-4 border border-red-dim bg-red-dim px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-red">
          High Demand
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 pr-28">
          <span
            className="border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em]"
            style={{
              borderColor: `${platform.color}55`,
              backgroundColor: `${platform.color}18`,
              color: platform.color,
            }}
          >
            {platform.label}
          </span>
          <span className="border border-gold-dim bg-gold-dim px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
            {listing.completion_pct}% Complete
          </span>
          <AccessBadge tier={accessTier} />
        </div>

        <div>
          <h2 className="flex flex-wrap items-end gap-3 font-display text-display-sm uppercase text-cream">
            {listing.is_anonymous && !isNdaTier ? (
              <span className="redacted h-8 w-56 select-none text-transparent">Anonymous project</span>
            ) : (
              <span>{displayName}</span>
            )}
            <span className="pb-1 font-mono text-xs uppercase tracking-[0.14em] text-muted">
              - {listing.category_label}
            </span>
          </h2>
          <p className="mt-3 max-w-3xl text-lg leading-7 text-cream2">{listing.public_summary}</p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.14em] text-teal2">
            Registered details and NDA material stay hidden until access is granted.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {listing.tech_stack.map((item) => (
            <span
              key={item}
              className="bg-[rgba(237,228,204,0.06)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] text-muted"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
          <span>{listing.completion_pct}% complete</span>
          <span>Listed {listedAt}</span>
          <span>{listing.views_count} views</span>
          <span>{listing.deal_types.join(" / ")}</span>
        </div>
      </div>

      <aside
        className={`flex flex-col justify-between border-t border-border pt-5 lg:border-l lg:border-t-0 lg:pl-6 ${
          listing.views_count > 400 ? "lg:pt-8" : "lg:pt-0"
        }`}
      >
        <div>
          <p className="font-display text-5xl uppercase text-gold">{price}</p>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Asking price, GBP
          </p>
        </div>

        <div className="mt-6 grid gap-3">
          <Link
            className="btn-liquid px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.16em]"
            href={`/nda/${listing.id}`}
          >
            Request NDA Access
          </Link>
          <Link
            className="border border-border px-4 py-3 text-center font-mono text-[11px] uppercase tracking-[0.16em] text-cream2 transition hover:border-border2 hover:text-gold"
            href={`/listings/${listing.id}`}
          >
            View Summary
          </Link>
        </div>
      </aside>
    </article>
  );
}

function AccessBadge({ tier }: { tier: AccessTier }) {
  if (tier === "nda") {
    return (
      <span className="inline-flex items-center gap-2 border border-teal-dim bg-teal-dim px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-teal2">
        <span className="h-2 w-2 rounded-full bg-teal2 animate-anon-pulse" />
        NDA Required
      </span>
    );
  }

  if (tier === "registered") {
    return (
      <span className="inline-flex items-center gap-2 border border-[#85B7EB33] bg-[#85B7EB14] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#85B7EB]">
        <span className="h-2 w-2 rounded-full bg-[#85B7EB]" />
        Registered Access
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 border border-border bg-[rgba(237,228,204,0.04)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
      <span className="h-2 w-2 rounded-full bg-muted" />
      Public Listing
    </span>
  );
}
