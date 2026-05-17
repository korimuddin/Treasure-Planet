"use client";

import { useState } from "react";
import { DealChat } from "@/components/dashboard/DealChat";
import { DealStageTracker } from "@/components/dashboard/DealStageTracker";
import { LOIForm } from "@/components/dashboard/LOIForm";
import type { Deal, NdaRequest } from "@/types/database";

type BuyerDeal = Deal & { listingTitle: string; ndaApproved: boolean };

export function BuyerDashboardClient({
  buyerName,
  currentUserId,
  ndaRequests,
  deals,
}: {
  buyerName: string;
  currentUserId: string;
  ndaRequests: NdaRequest[];
  deals: BuyerDeal[];
}) {
  const [selectedDealId, setSelectedDealId] = useState(deals[0]?.id ?? null);
  const selectedDeal = deals.find((deal) => deal.id === selectedDealId) ?? null;

  async function pay(dealId: string) {
    const response = await fetch(`/api/deals/${dealId}/pay`, { method: "POST" });
    if (response.ok) {
      window.location.reload();
    }
  }

  async function confirmReceipt(dealId: string) {
    const response = await fetch(`/api/deals/${dealId}/confirm-receipt`, { method: "POST" });
    if (response.ok) {
      window.location.reload();
    }
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Buyer dashboard</p>
          <h1 className="mt-2 font-display text-display-lg uppercase text-cream">{buyerName}</h1>
          <p className="mt-3 text-cream2">Track mutual NDA requests, offers, escrow, and seller conversations.</p>
        </header>

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <Panel title="Active NDA Requests">
              <div className="space-y-3">
                {ndaRequests.map((request) => (
                  <div key={request.id} className="border border-border bg-[rgba(4,9,15,0.6)] p-3">
                    <StatusBadge status={request.status} />
                    <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                      {request.deal_type} / £{(request.budget_max_gbp ?? 0).toLocaleString("en-GB")}
                    </p>
                  </div>
                ))}
                {ndaRequests.length === 0 && <p className="text-cream2">No NDA requests yet.</p>}
              </div>
            </Panel>

            <Panel title="Active Deals">
              <div className="space-y-3">
                {deals.map((deal) => (
                  <button
                    key={deal.id}
                    className={`w-full border p-3 text-left transition ${
                      selectedDealId === deal.id ? "border-gold bg-gold-dim" : "border-border bg-[rgba(4,9,15,0.6)]"
                    }`}
                    onClick={() => setSelectedDealId(deal.id)}
                    type="button"
                  >
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">{deal.listingTitle}</p>
                    <p className="mt-1 text-cream2">£{(deal.agreed_price_gbp / 100).toLocaleString("en-GB")}</p>
                  </button>
                ))}
                {deals.length === 0 && <p className="text-cream2">No active deals yet.</p>}
              </div>
            </Panel>
          </aside>

          <section className="space-y-5">
            {selectedDeal ? (
              <>
                <Panel title={selectedDeal.listingTitle}>
                  <DealStageTracker status={selectedDeal.status} />
                </Panel>
                {selectedDeal.status === "negotiating" && (
                  <LOIForm
                    dealId={selectedDeal.id}
                    dealType={selectedDeal.deal_type}
                    agreedPrice={selectedDeal.agreed_price_gbp}
                  />
                )}
                {selectedDeal.status === "loi_accepted" && (
                  <button
                    className="btn-liquid px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
                    type="button"
                    onClick={() => pay(selectedDeal.id)}
                  >
                    Initiate Escrow Payment
                  </button>
                )}
                {selectedDeal.status === "ip_transferred" && (
                  <button
                    className="btn-liquid px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
                    type="button"
                    onClick={() => confirmReceipt(selectedDeal.id)}
                  >
                    Confirm Receipt
                  </button>
                )}
                <DealChat dealId={selectedDeal.id} currentUserId={currentUserId} approved={selectedDeal.ndaApproved} />
              </>
            ) : (
              <Panel title="No deal selected">
                <p className="text-cream2">Select an active deal to view messages and next steps.</p>
              </Panel>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-border bg-[rgba(7,15,26,0.88)] p-5">
      <h2 className="mb-4 font-mono text-xs uppercase tracking-[0.16em] text-gold">{title}</h2>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="inline-flex border border-gold-dim bg-gold-dim px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-gold">
      {status.replace("_", " ")}
    </span>
  );
}
