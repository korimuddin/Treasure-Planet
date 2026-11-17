"use client";

import { useState } from "react";

const cards = [
  ["Anonymous If You Want", "Sellers choose whether to hide the project and their name until they approve a buyer."],
  ["Mutual NDA, Seller's Choice", "By default buyers sign a mutual NDA before requesting private details. Sellers can switch it off."],
  ["Seller Controls the Gate", "Sellers decide who sees the private details after reading each request."],
  ["Three Deal Structures", "Acquire, cofound, or merge depending on what the project and buyer need."],
  ["Aligned Pricing", "Asking prices, budgets, and offers stay visible enough to avoid wasted cycles."],
  ["Payment Held Until Receipt", "Purchases are paid through Stripe and released to the seller only when the buyer confirms receipt."],
];

const faqs = [
  ["Why anonymous?", "Anonymity lets sellers show enough signal to attract serious buyers without exposing the project or themselves too early. It is optional."],
  ["What makes the NDA mutual?", "The promise runs both ways: seller materials stay confidential, and buyer plans, budgets, and acquisition strategy are protected too."],
  ["How does seller approval work?", "The seller reads the buyer's name, stated budget, and message, then approves or declines."],
  ["How is the NDA enforced?", "The NDA is an agreement between buyer and seller. We record who signed, when, and the exact wording, and email both parties a copy. We can remove accounts that breach it, but we are not a party to it and cannot enforce it for you."],
  ["What is a no-shop clause?", "After an LOI is accepted, the seller pauses competing deal activity for a defined period while the buyer completes diligence."],
];

export default function AboutPage() {
  const [open, setOpen] = useState(0);

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="border-b border-border pb-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">About</p>
          <h1 className="mt-3 font-display text-display-lg uppercase text-cream">What is Treasure Planet?</h1>
          <p className="mt-4 max-w-3xl text-2xl italic text-cream2">
            A controlled marketplace for promising unfinished software, where trust is built in layers.
          </p>
        </header>

        <section className="grid grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-4">
          {cards.map(([title, text]) => (
            <article key={title} className="border border-border bg-[rgba(7,15,26,0.78)] p-5 transition hover:bg-[rgba(4,9,15,0.96)]">
              <h2 className="font-display text-3xl uppercase text-gold">{title}</h2>
              <p className="mt-3 text-cream2">{text}</p>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-display-sm uppercase text-cream">FAQ</h2>
          {faqs.map(([question, answer], index) => (
            <div key={question} className="border border-border bg-[rgba(7,15,26,0.78)]">
              <button
                className="flex w-full items-center justify-between px-5 py-4 text-left font-mono text-xs uppercase tracking-[0.16em] text-gold"
                onClick={() => setOpen(open === index ? -1 : index)}
                aria-expanded={open === index}
                aria-controls={`about-faq-${index}`}
                type="button"
              >
                {question}
                <span aria-hidden="true">{open === index ? "−" : "+"}</span>
              </button>
              {open === index && (
                <p id={`about-faq-${index}`} className="px-5 pb-5 text-cream2">
                  {answer}
                </p>
              )}
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
