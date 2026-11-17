"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Listing } from "@/types/database";

const budgets = [
  { label: "Under £10k", min: 0, max: 10000 },
  { label: "£10k–£25k", min: 10000, max: 25000 },
  { label: "£25k–£75k", min: 25000, max: 75000 },
  { label: "£75k+", min: 75000, max: 250000 },
];

type FormState = {
  dealType: "acquire" | "cofound" | "merge" | "undecided";
  budget: string;
  message: string;
  signedName: string;
  agree: boolean;
};

type RequestListing = Pick<Listing, "id" | "category_label" | "asking_price_gbp" | "requires_nda">;

export function NdaRequestForm({
  listing,
  buyerName,
  ndaText,
  previewMode = false,
}: {
  listing: RequestListing;
  buyerName: string;
  ndaText: string;
  previewMode?: boolean;
}) {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>({
    dealType: "undecided",
    budget: "0-10000",
    message: "",
    signedName: buyerName,
    agree: false,
  });
  const ndaRequired = listing.requires_nda;

  const price = new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(listing.asking_price_gbp / 100);

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setError(null);

    if (ndaRequired && (form.signedName.trim().length < 3 || !form.agree)) {
      setError("Type your full legal name and tick the agreement box to sign.");
      return;
    }

    if (previewMode) {
      setToast("Preview mode: nothing was sent.");
      return;
    }

    setIsSubmitting(true);
    const [budgetMin, budgetMax] = form.budget.split("-").map(Number);
    const response = await fetch("/api/nda/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listing_id: listing.id,
        deal_type: form.dealType,
        budget_min_gbp: budgetMin,
        budget_max_gbp: budgetMax,
        message: form.message,
        ...(ndaRequired ? { signed_name: form.signedName.trim(), agree: form.agree } : {}),
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: unknown };
      setError(typeof payload.error === "string" ? payload.error : "Unable to send the request.");
      setIsSubmitting(false);
      return;
    }

    setToast(
      ndaRequired
        ? "NDA signed. A copy has been emailed to you and your request is with the seller."
        : "Request sent to the seller.",
    );
    window.setTimeout(() => router.push("/dashboard/buyer"), 2500);
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">
            {ndaRequired ? "Mutual NDA access" : "Access request"}
          </p>
          <h1 className="mt-2 font-display text-display-lg uppercase text-cream">Request the private details</h1>
          <p className="mt-3 max-w-2xl text-cream2">
            {ndaRequired
              ? "This seller asks buyers to sign a mutual confidentiality agreement before sharing private project details. The seller then approves or declines your request."
              : "This seller does not require an NDA. Send a request and the seller will approve or decline it."}
          </p>
        </header>

        <section className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-5">
            <div className="border border-border bg-[rgba(7,15,26,0.92)] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Listing</p>
              <p className="mt-3 font-display text-3xl uppercase text-cream">{listing.category_label}</p>
              <p className="mt-5 font-display text-5xl text-gold">{price}</p>
              <p className="mt-2 text-cream2">Asking price. The seller reviews every request.</p>
            </div>

            {ndaRequired && (
              <div className="border border-border bg-[rgba(4,9,15,0.72)] p-5">
                <div className="mb-3 flex items-center gap-3">
                  <DocumentIcon />
                  <p className="font-mono text-xs uppercase tracking-[0.16em] text-gold">How signing works</p>
                </div>
                <p className="text-cream2">
                  You sign by typing your full legal name. We record your name, the time, and the exact wording you
                  agreed to, and email a copy to you and the seller. The agreement is between you and the seller;
                  Treasure Planet records it but is not a party to it and cannot enforce it for you.
                </p>
              </div>
            )}
          </aside>

          <form
            className="space-y-6 border border-border bg-[rgba(7,15,26,0.92)] p-6"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">Deal Type</span>
                <select
                  className="auth-input"
                  value={form.dealType}
                  onChange={(event) => update("dealType", event.target.value as FormState["dealType"])}
                >
                  <option value="acquire">Acquire</option>
                  <option value="cofound">Cofound</option>
                  <option value="merge">Merge</option>
                  <option value="undecided">Undecided</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
                  Budget Range
                </span>
                <select className="auth-input" value={form.budget} onChange={(event) => update("budget", event.target.value)}>
                  {budgets.map((budget) => (
                    <option key={budget.label} value={`${budget.min}-${budget.max}`}>
                      {budget.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
                  Message to the seller
                </span>
                <textarea
                  className="auth-input min-h-28"
                  maxLength={2000}
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                />
              </label>
            </div>

            {ndaRequired && (
              <>
                <div>
                  <p className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">
                    Mutual confidentiality agreement
                  </p>
                  <pre className="max-h-72 overflow-auto whitespace-pre-wrap border border-border bg-ink2 p-4 font-body text-sm leading-6 text-cream2">
                    {ndaText}
                  </pre>
                </div>
                <Field
                  label="Sign by typing your full legal name"
                  value={form.signedName}
                  onChange={(value) => update("signedName", value)}
                />
                <label className="flex items-start gap-3 text-cream2">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-gold"
                    checked={form.agree}
                    onChange={(event) => update("agree", event.target.checked)}
                  />
                  <span>
                    I have read the agreement above and agree to be bound by it. I also accept the{" "}
                    <Link className="text-gold hover:text-gold2" href="/legal">
                      Terms
                    </Link>
                    .
                  </span>
                </label>
              </>
            )}

            {error && <p className="font-mono text-xs uppercase tracking-[0.14em] text-red">{error}</p>}
            {toast && <p className="border border-teal-dim bg-teal-dim px-4 py-3 text-teal2">{toast}</p>}

            <button
              className="btn-liquid w-full px-5 py-4 font-mono text-xs uppercase tracking-[0.18em] disabled:opacity-60"
              type="submit"
              disabled={isSubmitting}
            >
              {ndaRequired ? "Sign Mutual NDA & Request Access" : "Request Access"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
      <input className="auth-input" type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function DocumentIcon() {
  return (
    <svg aria-hidden="true" className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 3h7l5 5v13H7z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
