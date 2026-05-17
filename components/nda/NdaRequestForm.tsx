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

const steps = ["Identity", "Mutual NDA", "Seller review", "Access decision"];

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  capacity: "company" | "individual";
  country: string;
  dealType: "acquire" | "cofound" | "merge" | "undecided";
  budget: string;
  message: string;
  agree: boolean;
};

export function NdaRequestForm({
  listing,
  buyerEmail,
  buyerName,
  previewMode = false,
}: {
  listing: Listing;
  buyerEmail: string;
  buyerName: string;
  previewMode?: boolean;
}) {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => {
    const [firstName = "", ...rest] = buyerName.split(" ");
    return {
      firstName,
      lastName: rest.join(" "),
      email: buyerEmail,
      capacity: "individual",
      country: "",
      dealType: "undecided",
      budget: "25000-75000",
      message: "",
      agree: false,
    };
  });

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

    if (!form.firstName || !form.lastName || !form.email || !form.country || !form.agree) {
      setError("Complete the identity fields and agreement checkbox before continuing.");
      return;
    }

    const [budgetMin, budgetMax] = form.budget.split("-").map(Number);
    const response = await fetch("/api/nda/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        listing_id: listing.id,
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        capacity: form.capacity,
        country: form.country,
        deal_type: form.dealType,
        budget_min_gbp: budgetMin,
        budget_max_gbp: budgetMax,
        message: form.message,
      }),
    });

    if (!response.ok && !previewMode) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Unable to send the mutual NDA request.");
      return;
    }

    for (let index = 0; index < steps.length; index += 1) {
      setActiveStep(index);
      await wait(420);
      setDoneSteps((current) => Array.from(new Set([...current, index])));
    }

    setToast("NDA signed via DocuSign — request sent to seller");
    window.setTimeout(() => router.push("/dashboard/buyer"), 2500);
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Mutual NDA access</p>
          <h1 className="mt-2 font-display text-display-lg uppercase text-cream">
            Request the private data room
          </h1>
          <p className="mt-3 max-w-2xl text-cream2">
            The mutual NDA protects seller IP and buyer strategy before deeper project materials are revealed.
          </p>
        </header>

        <StepIndicator activeStep={activeStep} doneSteps={doneSteps} />

        <section className="grid gap-8 lg:grid-cols-[380px_1fr]">
          <aside className="space-y-5">
            <div className="border border-border bg-[rgba(7,15,26,0.92)] p-5">
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-muted">Project preview</p>
              <div className="redacted mt-4 h-8 w-56 text-transparent">Anonymous project</div>
              <p className="mt-3 font-mono text-xs uppercase tracking-[0.16em] text-muted">
                {listing.category_label}
              </p>
              <p className="mt-5 font-display text-5xl text-gold">{price}</p>
              <p className="mt-2 text-cream2">Seller reviews your profile after signing.</p>
            </div>

            <div className="border border-gold-dim bg-gold-dim px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-gold">
              This is a mutual NDA: seller IP and buyer strategy are both protected.
            </div>

            <div className="border border-border bg-[rgba(4,9,15,0.72)] p-5">
              <div className="mb-3 flex items-center gap-3">
                <DocumentIcon />
                <p className="font-mono text-xs uppercase tracking-[0.16em] text-gold">DocuSign signing</p>
              </div>
              <p className="text-cream2">
                This mutual NDA protects both parties. Signed digitally via DocuSign. Both parties receive a
                timestamped copy. Standard legally binding NDA, enforceable in UK, EU, and US jurisdictions.
              </p>
            </div>

            <div className="space-y-3 border border-border bg-[rgba(4,9,15,0.72)] p-5 font-mono text-xs uppercase tracking-[0.13em]">
              {[
                "Mutual confidentiality",
                "Seller IP protected",
                "Buyer strategy protected",
                "Timestamped copies for both parties",
              ].map((item) => (
                <p key={item} className="text-teal2">
                  ✓ {item}
                </p>
              ))}
              <p className="text-red">! Breach may remove access and end the review.</p>
            </div>
          </aside>

          <form
            className="space-y-6 border border-border bg-[rgba(7,15,26,0.92)] p-6"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First Name" value={form.firstName} onChange={(value) => update("firstName", value)} />
              <Field label="Last Name" value={form.lastName} onChange={(value) => update("lastName", value)} />
              <Field label="Email" type="email" value={form.email} onChange={(value) => update("email", value)} />
              <label className="block">
                <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">Capacity</span>
                <select
                  className="auth-input"
                  value={form.capacity}
                  onChange={(event) => update("capacity", event.target.value as FormState["capacity"])}
                >
                  <option value="company">Company</option>
                  <option value="individual">Individual</option>
                </select>
              </label>
              <Field label="Country" value={form.country} onChange={(value) => update("country", value)} />
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
              <label className="block sm:col-span-2">
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
                <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">Message</span>
                <textarea
                  className="auth-input min-h-36"
                  value={form.message}
                  onChange={(event) => update("message", event.target.value)}
                />
              </label>
            </div>

            <label className="flex items-start gap-3 text-cream2">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 accent-gold"
                checked={form.agree}
                onChange={(event) => update("agree", event.target.checked)}
              />
              <span>
                I agree to the mutual NDA Framework and Terms in{" "}
                <Link className="text-gold hover:text-gold2" href="/legal">
                  Legal
                </Link>
                .
              </span>
            </label>

            {error && <p className="font-mono text-xs uppercase tracking-[0.14em] text-red">{error}</p>}
            {toast && <p className="border border-teal-dim bg-teal-dim px-4 py-3 text-teal2">{toast}</p>}

            <button className="btn-liquid w-full px-5 py-4 font-mono text-xs uppercase tracking-[0.18em]" type="submit">
              Sign Mutual NDA & Request Access
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

function StepIndicator({ activeStep, doneSteps }: { activeStep: number; doneSteps: number[] }) {
  return (
    <div className="grid grid-cols-4 items-center gap-2">
      {steps.map((step, index) => {
        const done = doneSteps.includes(index);
        const active = activeStep === index;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-2">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full border font-mono text-xs ${
                  done
                    ? "border-teal2 bg-teal-dim text-teal2"
                    : active
                      ? "border-gold bg-gold-dim text-gold"
                      : "border-border text-muted"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted">{step}</span>
            </div>
            {index < steps.length - 1 && <div className="mx-2 h-px flex-1 bg-border" />}
          </div>
        );
      })}
    </div>
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

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
