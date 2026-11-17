"use client";

import { useState } from "react";
import { DealChat } from "@/components/dashboard/DealChat";
import { DealStageTracker } from "@/components/dashboard/DealStageTracker";
import { LOIForm } from "@/components/dashboard/LOIForm";
import type { Deal, DealType, NdaRequest } from "@/types/database";

type BuyerDeal = Deal & { listingTitle: string; ndaApproved: boolean };
type BuyerRequest = NdaRequest & { listingTitle: string; askingPrice: number };

const pounds = (pence: number) => `£${(pence / 100).toLocaleString("en-GB")}`;

export function BuyerDashboardClient({
  buyerName,
  currentUserId,
  emailConfirmed,
  ndaRequests,
  deals,
}: {
  buyerName: string;
  currentUserId: string;
  emailConfirmed: boolean;
  ndaRequests: BuyerRequest[];
  deals: BuyerDeal[];
}) {
  const [selectedDealId, setSelectedDealId] = useState(deals[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectedDeal = deals.find((deal) => deal.id === selectedDealId) ?? null;
  const openDealRequestIds = new Set(
    deals.filter((deal) => deal.status !== "cancelled").map((deal) => deal.nda_request_id),
  );

  /** POSTs to an API route, surfaces any error, and returns the JSON body on success. */
  async function post(url: string, body?: unknown) {
    setError(null);
    setBusy(true);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const payload = (await response.json().catch(() => ({}))) as { error?: unknown; url?: string };

      if (!response.ok) {
        setError(typeof payload.error === "string" ? payload.error : "Something went wrong. Please try again.");
        return null;
      }

      return payload;
    } finally {
      setBusy(false);
    }
  }

  async function makeOffer(request: BuyerRequest) {
    const dealType: DealType = request.deal_type === "undecided" ? "acquire" : request.deal_type;
    const result = await post("/api/deals", {
      nda_request_id: request.id,
      deal_type: dealType,
      agreed_price_gbp: Math.max(request.askingPrice, 100),
    });
    if (result) window.location.reload();
  }

  async function pay(dealId: string) {
    const result = await post(`/api/deals/${dealId}/pay`);
    if (result?.url) window.location.href = result.url;
  }

  async function act(dealId: string, action: "accept-loi" | "confirm-receipt") {
    if (
      action === "confirm-receipt" &&
      !window.confirm("Confirming receipt releases your payment to the seller. This cannot be undone. Continue?")
    ) {
      return;
    }
    const result = await post(`/api/deals/${dealId}/${action}`);
    if (result) window.location.reload();
  }

  async function raiseProblem(dealId: string) {
    const reason = window.prompt("Describe what is wrong. The payment stays held while we review it.");
    if (!reason) return;
    const result = await post(`/api/deals/${dealId}/dispute`, { reason });
    if (result) window.location.reload();
  }

  const loi = (selectedDeal?.loi_data ?? {}) as { submitted_by?: string };
  const canAcceptCounter = selectedDeal?.status === "loi_sent" && loi.submitted_by && loi.submitted_by !== currentUserId;
  const paymentHeld = selectedDeal?.status === "in_escrow" || selectedDeal?.status === "ip_transferred";

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Buyer dashboard</p>
          <h1 className="mt-2 font-display text-display-lg uppercase text-cream">{buyerName}</h1>
          <p className="mt-3 text-cream2">Track access requests, offers, payments, and seller conversations.</p>
        </header>

        {!emailConfirmed && (
          <p className="border border-gold-dim bg-gold-dim px-4 py-3 text-cream2">
            Confirm your email address using the link we sent you before requesting access or making offers.
          </p>
        )}
        {error && (
          <p role="alert" className="border border-red-dim bg-red-dim px-4 py-3 text-red">
            {error}
          </p>
        )}

        <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="space-y-5">
            <Panel title="Access Requests">
              <div className="space-y-3">
                {ndaRequests.map((request) => (
                  <div key={request.id} className="border border-border bg-[rgba(4,9,15,0.6)] p-3">
                    <p className="font-mono text-xs uppercase tracking-[0.14em] text-gold">{request.listingTitle}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge status={request.status} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
                        {request.nda_required ? "NDA signed" : "No NDA required"}
                      </span>
                    </div>
                    {request.status === "approved" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          className="border border-border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-cream2 hover:text-gold"
                          href={`/listings/${request.listing_id}`}
                        >
                          View private details
                        </a>
                        {!openDealRequestIds.has(request.id) && (
                          <button
                            type="button"
                            disabled={busy}
                            className="border border-gold-dim px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-gold disabled:opacity-60"
                            onClick={() => makeOffer(request)}
                          >
                            Start a deal
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {ndaRequests.length === 0 && <p className="text-cream2">No access requests yet.</p>}
              </div>
            </Panel>

            <Panel title="Deals">
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
                    <p className="mt-1 text-cream2">{pounds(deal.agreed_price_gbp)}</p>
                  </button>
                ))}
                {deals.length === 0 && <p className="text-cream2">No deals yet.</p>}
              </div>
            </Panel>
          </aside>

          <section className="space-y-5">
            {selectedDeal ? (
              <>
                <Panel title={`${selectedDeal.listingTitle} / ${pounds(selectedDeal.agreed_price_gbp)}`}>
                  <DealStageTracker status={selectedDeal.status} />
                  <p className="mt-4 text-cream2">{stageHelp(selectedDeal, Boolean(canAcceptCounter))}</p>
                </Panel>
                {(selectedDeal.status === "negotiating" || selectedDeal.status === "loi_sent") && (
                  <LOIForm
                    dealId={selectedDeal.id}
                    dealType={selectedDeal.deal_type}
                    agreedPrice={selectedDeal.agreed_price_gbp}
                    onSubmitted={() => window.location.reload()}
                  />
                )}
                <div className="flex flex-wrap gap-3">
                  {canAcceptCounter && (
                    <ActionButton disabled={busy} onClick={() => act(selectedDeal.id, "accept-loi")}>
                      Accept seller&apos;s terms ({pounds(selectedDeal.agreed_price_gbp)})
                    </ActionButton>
                  )}
                  {(selectedDeal.status === "loi_accepted" || selectedDeal.status === "payment_pending") &&
                    selectedDeal.deal_type === "acquire" && (
                      <ActionButton disabled={busy} onClick={() => pay(selectedDeal.id)}>
                        Pay {pounds(selectedDeal.agreed_price_gbp)} securely
                      </ActionButton>
                    )}
                  {selectedDeal.status === "ip_transferred" && (
                    <ActionButton disabled={busy} onClick={() => act(selectedDeal.id, "confirm-receipt")}>
                      Confirm receipt &amp; release payment
                    </ActionButton>
                  )}
                  {paymentHeld && (
                    <button
                      type="button"
                      disabled={busy}
                      className="border border-red-dim px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-red disabled:opacity-60"
                      onClick={() => raiseProblem(selectedDeal.id)}
                    >
                      Report a problem
                    </button>
                  )}
                </div>
                <DealChat dealId={selectedDeal.id} currentUserId={currentUserId} approved={selectedDeal.ndaApproved} />
              </>
            ) : (
              <Panel title="No deal selected">
                <p className="text-cream2">
                  When a seller approves your access request, start a deal from the panel on the left.
                </p>
              </Panel>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}

function stageHelp(deal: BuyerDeal, canAcceptCounter: boolean) {
  switch (deal.status) {
    case "negotiating":
      return "Propose your terms below. The seller can accept or counter.";
    case "loi_sent":
      return canAcceptCounter
        ? "The seller has countered. Accept their terms, or send new ones below."
        : "Your terms are with the seller.";
    case "loi_accepted":
      return deal.deal_type === "acquire"
        ? "Terms agreed. Pay to continue: your payment is held by Stripe and only released when you confirm you have received the project."
        : "Terms agreed. Co-found and merge deals are completed directly between you and the seller.";
    case "payment_pending":
      return "Your payment has not been confirmed yet. Bank payments can take a few minutes. You can reopen checkout if you did not finish.";
    case "in_escrow":
      return "Payment received and held. Waiting for the seller to transfer the project.";
    case "ip_transferred":
      return "The seller says the project has been transferred. Check everything, then confirm receipt to release the payment.";
    case "completed":
      return "Deal complete. The payment has been released to the seller.";
    case "disputed":
      return "A problem has been reported. The payment stays held while Treasure Planet reviews the deal.";
    case "cancelled":
      return deal.refunded_at ? "Deal cancelled. Your payment has been refunded." : "Deal cancelled.";
    default:
      return "";
  }
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="btn-liquid px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] disabled:opacity-60"
      type="button"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
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
