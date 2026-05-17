"use client";

import { useState } from "react";
import { DealChat } from "@/components/dashboard/DealChat";
import { DealStageTracker } from "@/components/dashboard/DealStageTracker";
import type { Deal, NdaRequestStatus, SellerSettings } from "@/types/database";

export type SellerRequestCard = {
  id: string;
  status: NdaRequestStatus;
  buyerName: string;
  buyerInitials: string;
  company: string;
  country: string;
  dealType: string;
  budgetMin: number;
  budgetMax: number;
  message: string;
  listingTitle: string;
};

type Stats = {
  views: number;
  requests: number;
  approved: number;
  awaitingReview: number;
};

export type SellerDealCard = Deal & { listingTitle: string; ndaApproved: boolean };

export function SellerDashboardClient({
  sellerName,
  currentUserId,
  stats,
  requests,
  settings,
  needsPaymentSetup,
  deals,
}: {
  sellerName: string;
  currentUserId: string;
  stats: Stats;
  requests: SellerRequestCard[];
  settings: SellerSettings;
  needsPaymentSetup: boolean;
  deals: SellerDealCard[];
}) {
  const [cards, setCards] = useState(requests);
  const [dealCards, setDealCards] = useState(deals);
  const [selectedDealId, setSelectedDealId] = useState(deals[0]?.id ?? null);
  const [autoApprove, setAutoApprove] = useState(settings.auto_approve);
  const selectedDeal = dealCards.find((deal) => deal.id === selectedDealId) ?? null;

  async function persistAutoApprove(nextValue: boolean) {
    setAutoApprove(nextValue);
    await fetch("/api/seller-settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...settings,
        auto_approve: nextValue,
      }),
    });
  }

  async function startPaymentSetup() {
    const response = await fetch("/api/stripe/connect-onboard", {
      method: "POST",
    });

    if (!response.ok) {
      return;
    }

    const payload = (await response.json()) as { url?: string };

    if (payload.url) {
      window.location.href = payload.url;
    }
  }

  async function decide(requestId: string, decision: "approve" | "decline") {
    const response = await fetch(`/api/nda/${requestId}/${decision}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: decision === "decline" ? JSON.stringify({ decline_reason: "Seller declined this access request." }) : "{}",
    });

    if (!response.ok) {
      return;
    }

    setCards((current) =>
      current.map((card) =>
        card.id === requestId
          ? {
              ...card,
              status: decision === "approve" ? "approved" : "declined",
            }
          : card,
      ),
    );
  }

  async function dealAction(dealId: string, action: "accept-loi" | "confirm-transfer" | "submit-loi") {
    const response = await fetch(`/api/deals/${dealId}/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body:
        action === "submit-loi"
          ? JSON.stringify({
              deal_type: selectedDeal?.deal_type ?? "acquire",
              agreed_price_gbp: selectedDeal?.agreed_price_gbp ?? 1,
              special_conditions: "Seller counter submitted from dashboard.",
            })
          : "{}",
    });

    if (response.ok) {
      const payload = (await response.json()) as { deal?: SellerDealCard };
      if (payload.deal) {
        setDealCards((current) =>
          current.map((deal) =>
            deal.id === dealId ? { ...deal, ...payload.deal, listingTitle: deal.listingTitle } : deal,
          ),
        );
      }
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Seller dashboard</p>
          <h1 className="mt-2 font-display text-display-lg uppercase text-cream">{sellerName}</h1>
          <p className="mt-3 text-cream2">Review mutual NDA requests and move buyers toward data room access.</p>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Views" value={stats.views} />
          <StatCard label="NDA Requests" value={stats.requests} />
          <StatCard label="Approved" value={stats.approved} />
          <StatCard label="Awaiting Review" value={stats.awaitingReview} />
        </section>

        {needsPaymentSetup && (
          <section className="flex flex-col gap-4 border border-gold-dim bg-gold-dim p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-gold">Payment setup</p>
              <p className="mt-1 text-cream2">Complete payment setup to receive funds when your deal closes.</p>
            </div>
            <button
              type="button"
              className="btn-liquid px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
              onClick={startPaymentSetup}
            >
              Set Up Payments
            </button>
          </section>
        )}

        <section className="border border-border bg-[rgba(7,15,26,0.86)] p-5">
          <DealStageTracker status={selectedDeal?.status ?? "negotiating"} />
        </section>

        <section className="flex items-center justify-between border border-border bg-[rgba(7,15,26,0.86)] p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.16em] text-gold">Auto-approve mutual NDA requests</p>
            <p className="mt-1 text-cream2">Approved matches can move directly into full data room access.</p>
          </div>
          <button
            type="button"
            aria-pressed={autoApprove}
            aria-label="Toggle automatic mutual NDA approval"
            className={`relative h-8 w-14 rounded-full border transition ${
              autoApprove ? "border-teal2 bg-teal-dim" : "border-border bg-[rgba(4,9,15,0.9)]"
            }`}
            onClick={() => persistAutoApprove(!autoApprove)}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full transition ${
                autoApprove ? "left-7 bg-teal2" : "left-1 bg-muted"
              }`}
            />
          </button>
        </section>

        <section className="space-y-4">
          {cards.map((card) => (
            <RequestCard key={card.id} card={card} decide={decide} />
          ))}
          {cards.length === 0 && (
            <div className="border border-border bg-[rgba(7,15,26,0.72)] p-8 text-center text-cream2">
              No mutual NDA requests are awaiting review.
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <div className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-gold">Active deals</h2>
            {dealCards.map((deal) => (
              <button
                key={deal.id}
                type="button"
                className={`w-full border p-3 text-left ${
                  selectedDealId === deal.id ? "border-gold bg-gold-dim" : "border-border bg-[rgba(4,9,15,0.6)]"
                }`}
                onClick={() => setSelectedDealId(deal.id)}
              >
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">{deal.listingTitle}</p>
                <p className="mt-1 text-cream2">{deal.status.replace("_", " ")}</p>
              </button>
            ))}
            {dealCards.length === 0 && <p className="text-cream2">No active deals yet.</p>}
          </div>

          <div className="space-y-4">
            {selectedDeal ? (
              <>
                <section className="border border-border bg-[rgba(7,15,26,0.88)] p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-display text-display-sm uppercase text-cream">{selectedDeal.listingTitle}</h2>
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">
                      £{(selectedDeal.agreed_price_gbp / 100).toLocaleString("en-GB")}
                    </p>
                  </div>
                  <DealStageTracker status={selectedDeal.status} />
                  {selectedDeal.loi_data && Object.keys(selectedDeal.loi_data as object).length > 0 && (
                    <pre className="mt-4 overflow-auto border border-border bg-ink2 p-3 text-xs text-cream2">
                      {JSON.stringify(selectedDeal.loi_data, null, 2)}
                    </pre>
                  )}
                  <div className="mt-5 flex flex-wrap gap-3">
                    {selectedDeal.status === "loi_sent" && (
                      <>
                        <button
                          type="button"
                          className="bg-teal px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-ink"
                          onClick={() => dealAction(selectedDeal.id, "accept-loi")}
                        >
                          Accept LOI
                        </button>
                        <button
                          type="button"
                          className="border border-gold-dim px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-gold"
                          onClick={() => dealAction(selectedDeal.id, "submit-loi")}
                        >
                          Counter LOI
                        </button>
                      </>
                    )}
                    {selectedDeal.status === "in_escrow" && (
                      <button
                        type="button"
                        className="btn-liquid px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
                        onClick={() => dealAction(selectedDeal.id, "confirm-transfer")}
                      >
                        Confirm IP Transfer
                      </button>
                    )}
                  </div>
                </section>
                <DealChat dealId={selectedDeal.id} currentUserId={currentUserId} approved={selectedDeal.ndaApproved} />
              </>
            ) : (
              <div className="border border-border bg-[rgba(7,15,26,0.72)] p-8 text-center text-cream2">
                Select a deal to view stage, LOI, and chat.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border bg-[rgba(7,15,26,0.86)] p-4">
      <p className="font-display text-4xl text-gold">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
    </div>
  );
}

function RequestCard({
  card,
  decide,
}: {
  card: SellerRequestCard;
  decide: (requestId: string, decision: "approve" | "decline") => void;
}) {
  const approved = card.status === "approved";
  const declined = card.status === "declined";

  return (
    <article
      className={`grid gap-5 border bg-[rgba(7,15,26,0.88)] p-5 transition lg:grid-cols-[1fr_auto] ${
        approved ? "border-teal2" : "border-border"
      } ${declined ? "opacity-40" : ""}`}
    >
      <div className="flex gap-4">
        <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold-dim font-mono text-sm uppercase tracking-[0.14em] text-gold">
          {card.buyerInitials}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-display-sm uppercase text-cream">{card.buyerName}</h2>
            <span className="border border-teal-dim bg-teal-dim px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-teal2">
              ✓ ID Verified
            </span>
            <span className="border border-gold-dim bg-gold-dim px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
              £ Funds: £{card.budgetMin.toLocaleString("en-GB")}–£{card.budgetMax.toLocaleString("en-GB")}
            </span>
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {card.company} / {card.country} / {card.dealType} / {card.listingTitle}
          </p>
          <p className="mt-4 text-xl italic leading-7 text-cream2">“{card.message}”</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {approved ? (
          <button className="border border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-cream2">
            Message
          </button>
        ) : declined ? (
          <span className="font-mono text-xs uppercase tracking-[0.16em] text-red">Declined</span>
        ) : (
          <>
            <button
              className="bg-teal px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-ink"
              onClick={() => decide(card.id, "approve")}
            >
              Approve
            </button>
            <button
              className="border border-red-dim px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-red"
              onClick={() => decide(card.id, "decline")}
            >
              Decline
            </button>
          </>
        )}
      </div>
    </article>
  );
}
