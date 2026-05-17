"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ListingCard } from "@/components/listings/ListingCard";
import type { AccessTier, FilteredListing } from "@/lib/listings/access";
import type { ListingNdaStatus } from "@/types/database";

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  const [listing, setListing] = useState<FilteredListing | null>(null);
  const [accessTier, setAccessTier] = useState<AccessTier>("public");
  const [ndaStatus, setNdaStatus] = useState<ListingNdaStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadListing() {
      const response = await fetch(`/api/listings/${params.id}`, { cache: "no-store" });

      if (!response.ok) {
        setIsLoading(false);
        return;
      }

      const payload = (await response.json()) as {
        listing: FilteredListing;
        accessTier: AccessTier;
        ndaStatus: ListingNdaStatus | null;
      };

      if (isMounted) {
        setListing(payload.listing);
        setAccessTier(payload.accessTier);
        setNdaStatus(payload.ndaStatus);
        setIsLoading(false);
      }
    }

    loadListing().catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <Link className="font-mono text-xs uppercase tracking-[0.16em] text-gold" href="/marketplace">
          Back to marketplace
        </Link>
        <header className="border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Listing summary</p>
          <h1 className="mt-2 font-display text-display-md uppercase text-cream">Access-filtered project view</h1>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-muted">
            Current tier: {accessTier} {ndaStatus ? `/ NDA ${ndaStatus}` : ""}
          </p>
        </header>

        {listing && <ListingCard listing={listing} accessTier={accessTier} />}
        {!listing && !isLoading && (
          <div className="border border-border bg-[rgba(7,15,26,0.72)] p-8 text-center text-cream2">
            Listing not found.
          </div>
        )}
      </div>
    </main>
  );
}
