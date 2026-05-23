"use client";

import Link from "next/link";
import { useState } from "react";
import { OnboardingSaleDemo } from "@/components/onboarding/OnboardingSaleDemo";

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
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="royal-glass overflow-hidden p-6 sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted">How it works</p>
              <h1 className="royal-gradient-text mt-3 font-display text-display-lg uppercase">
                See a Treasure Planet sale in motion
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-7 text-cream2">
                New buyers can try the guided sale demo first: filter anonymous listings by tags, platform, completion,
                and price, then walk through the exact six steps from mutual NDA to closing.
              </p>
            </div>
            <div className="border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(24,91,220,0.20))] p-5">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Recommended first</p>
              <p className="mt-3 text-cream2">
                Use the demo to understand what unlocks when, what the seller sees, and how escrow closes the deal.
              </p>
              <Link
                href="#demo"
                className="btn-liquid mt-5 inline-flex w-full items-center justify-center px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
              >
                Open Sale Demo
              </Link>
            </div>
          </div>
        </header>

        <OnboardingSaleDemo />

        <section className="mx-auto max-w-5xl space-y-8 pt-4">
          <header>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Process</p>
            <h2 className="royal-gradient-text mt-3 font-display text-display-lg uppercase">Buyer, seller, cofounder paths</h2>
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
        </section>
      </div>
    </main>
  );
}
