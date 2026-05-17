"use client";

import { useState } from "react";

const flows = {
  Buyer: [
    ["Browse", "Scan anonymous public listings by platform, price, completion, and technical signal.", "Use filters to narrow by platform before requesting deeper access."],
    ["Register", "Create a verified buyer profile so sellers know who is asking.", "A stronger profile improves seller response rates."],
    ["Sign NDA", "Sign the mutual NDA before any private project detail is released.", "Both sides are protected before strategy or IP moves."],
    ["Seller Approves", "The seller reviews your profile, budget, and deal intent.", "Clear intent helps the seller make a fast decision."],
    ["Data Room", "Approved buyers see the private tier and can discuss specifics with the seller.", "Keep diligence questions inside deal chat."],
    ["Close", "Move through LOI, escrow, transfer, and receipt confirmation.", "Funds are held until the buyer confirms receipt."],
  ],
  Seller: [
    ["Verify", "Complete identity and payment setup before publishing.", "Verified sellers build trust faster."],
    ["Build Listing", "Separate public, registered, and NDA-tier content.", "Public content should sell the opportunity without naming it."],
    ["Access Settings", "Choose manual review or auto-approval rules for qualified buyers.", "You stay in control of the data room gate."],
    ["Review Requests", "Inspect buyer profile, funds, and message before approving.", "Approve only when the buyer fit is real."],
    ["Close", "Accept LOI, manage no-shop, receive escrow, and confirm transfer.", "Keep all deal steps inside the platform."],
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
