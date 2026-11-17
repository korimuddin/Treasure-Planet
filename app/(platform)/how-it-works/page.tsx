"use client";

import { useState } from "react";

const flows = {
  Buyer: [
    ["Browse", "Scan public listings by platform, price, completion, and technical signal.", "Use filters to narrow by platform before requesting deeper access."],
    ["Register", "Create an account and confirm your email address.", "No identity check is needed to browse or request access."],
    ["Request Access", "Sign the mutual NDA if the seller requires one, and tell the seller what you have in mind.", "Some sellers switch the NDA off; the listing says which applies."],
    ["Seller Approves", "The seller reviews your profile, budget, and deal intent.", "Clear intent helps the seller make a fast decision."],
    ["Private Details", "Approved buyers see the private details and can discuss specifics with the seller.", "Keep your questions inside deal chat so there is a record."],
    ["Close", "Agree terms, pay through Stripe, receive the project, and confirm receipt.", "Your payment is held by Stripe until you confirm receipt."],
  ],
  Seller: [
    ["Set Up Payouts", "Connect a Stripe account so buyers can pay you. Stripe verifies your identity.", "You can list first and set up payouts before your first sale."],
    ["Build Listing", "Separate public, registered, and NDA-tier content.", "Choose whether the listing is anonymous and whether buyers must sign the NDA."],
    ["Access Settings", "Choose manual review or auto-approval rules for qualified buyers.", "You stay in control of who sees the private details."],
    ["Review Requests", "Read the buyer's name, stated budget, and message before approving.", "Approve only when the buyer fit is real."],
    ["Close", "Agree terms, transfer the project once the buyer has paid, and get paid when they confirm receipt.", "Our 10% fee is deducted when the payment is released."],
  ],
  Cofounder: [
    ["Signal", "Use unfinished work as proof of execution rather than a pitch deck."],
    ["Match", "Find builders or buyers whose strengths complement the project."],
    ["Structure", "Choose cofound, merge, or acquisition terms based on fit."],
    ["Commit", "Move from conversation to written intent when alignment is clear."],
  ],
};

type Tab = keyof typeof flows;

export default function HowItWorksPage() {
  const [tab, setTab] = useState<Tab>("Buyer");

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Process</p>
          <h1 className="mt-3 font-display text-display-lg uppercase text-cream">How it works</h1>
        </header>
        <nav className="flex gap-6 border-b border-border">
          {(Object.keys(flows) as Tab[]).map((item) => (
            <button
              key={item}
              className={`pb-3 font-mono text-xs uppercase tracking-[0.16em] ${tab === item ? "border-b-2 border-gold text-gold" : "text-muted"}`}
              onClick={() => setTab(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
        <section className="space-y-0">
          {flows[tab].map(([title, text, tip], index) => (
            <div key={title} className="grid grid-cols-[56px_1fr] gap-4">
              <div className="flex flex-col items-center">
                <span className="grid h-11 w-11 place-items-center rounded-full border border-gold bg-gold-dim font-display text-2xl text-gold">
                  {index + 1}
                </span>
                {index < flows[tab].length - 1 && <span className="h-full w-px bg-border" />}
              </div>
              <div className="pb-8">
                <h2 className="font-display text-3xl uppercase text-cream">{title}</h2>
                <p className="mt-2 text-cream2">{text}</p>
                {tip && <p className="mt-3 border border-teal-dim bg-teal-dim px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-teal2">{tip}</p>}
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
