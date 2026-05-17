"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ListingCard } from "@/components/listings/ListingCard";
import type { FilteredListing } from "@/lib/listings/access";
import type { ListingPlatform } from "@/types/database";

type FilterKey = "all" | ListingPlatform | "gaming";

const filters: { label: string; value: FilterKey }[] = [
  { label: "All", value: "all" },
  { label: "iOS", value: "ios" },
  { label: "Android", value: "android" },
  { label: "macOS", value: "macos" },
  { label: "Windows", value: "windows" },
  { label: "Gaming", value: "gaming" },
];

export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState<FilterKey>("all");
  const [listings, setListings] = useState<FilteredListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadListings() {
      setIsLoading(true);
      const response = await fetch("/api/listings", { cache: "no-store" });
      const payload = (await response.json()) as { listings?: FilteredListing[] };

      if (isMounted) {
        setListings(payload.listings ?? []);
        setIsLoading(false);
      }
    }

    loadListings().catch(() => {
      if (isMounted) {
        setListings([]);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleListings = useMemo(() => {
    if (activeFilter === "all") {
      return listings;
    }

    if (activeFilter === "gaming") {
      return listings.filter((listing) => listing.platform.endsWith("gaming"));
    }

    return listings.filter((listing) => listing.platform === activeFilter);
  }, [activeFilter, listings]);

  const countLabel = isLoading
    ? "Scanning listings"
    : `${visibleListings.length} ${visibleListings.length === 1 ? "listing" : "listings"} visible`;

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="border border-teal-dim bg-teal-dim px-4 py-3">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.16em] text-teal2">
            <span className="h-2.5 w-2.5 rounded-full bg-teal2 animate-anon-pulse" />
            All listings are anonymous until the seller approves deeper access.
          </div>
        </section>

        <section className="flex flex-col gap-5 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Marketplace</p>
            <h1 className="mt-2 font-display text-display-lg uppercase text-cream">
              Abandoned software, ready for a second run
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-cream2">
              Browse anonymised projects by platform, completion, deal shape, and technical signal.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <LegendDot color="var(--muted)" label="Public" />
            <LegendDot color="#85B7EB" label="Registered" />
            <LegendDot color="var(--teal2)" label="NDA" />
          </div>
        </section>

        <section className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`shrink-0 border px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] transition ${
                activeFilter === filter.value
                  ? "border-border2 bg-gold-dim text-gold"
                  : "border-border bg-[rgba(4,9,15,0.55)] text-muted hover:border-border2 hover:text-cream"
              }`}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </section>

        <section>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-display text-display-sm uppercase text-cream">Live listings</h2>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">{countLabel}</p>
          </div>

          <div className="space-y-5">
            {visibleListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} accessTier="public" />
            ))}
          </div>

          {!isLoading && visibleListings.length === 0 && (
            <div className="border border-border bg-[rgba(7,15,26,0.72)] p-8 text-center text-cream2">
              No live listings match this filter yet.
            </div>
          )}
        </section>

        <section className="overflow-hidden border border-teal-dim bg-[radial-gradient(circle_at_20%_20%,rgba(61,184,144,0.18),rgba(7,15,26,0.92)_42%)] p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-display text-display-sm uppercase text-teal2">Proof of Work. Not Promises.</h2>
              <p className="mt-2 max-w-2xl text-cream2">
                Match with builders around unfinished products, technical evidence, and clear next steps.
              </p>
            </div>
            <Link
              href="/how-it-works"
              className="border border-teal-dim px-5 py-3 text-center font-mono text-xs uppercase tracking-[0.16em] text-teal2 transition hover:border-teal2"
            >
              Explore Cofounder Matching
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
