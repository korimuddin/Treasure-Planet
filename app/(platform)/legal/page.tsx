"use client";

import { useState } from "react";

const docs = {
  "Terms of Service": [
    ["Platform Role", "Treasure Planet provides marketplace tools for discovery, diligence, messaging, NDA access, LOI workflow, and escrow coordination. Users remain responsible for their own commercial decisions and representations."],
    ["Accounts", "Users must provide accurate registration, identity, and payment information. We may suspend accounts that provide misleading information, misuse confidential material, or attempt to bypass platform workflows."],
    ["Listings and Offers", "Sellers must own or control the rights they list. Buyers must only submit offers they are authorised and financially prepared to pursue."],
    ["Fees and Payments", "Platform fees are collected through Stripe Connect as part of the payment flow. Funds may be held until deal milestones are confirmed."],
    ["Conduct", "Users must communicate honestly, preserve confidentiality, respect access limits, and avoid harassment, spam, or circumvention."],
  ],
  "Privacy Policy": [
    ["Controller", "Treasure Planet acts as controller for account, profile, compliance, and marketplace usage data. ICO registration is maintained for UK data protection accountability."],
    ["Data We Process", "We process identity details, contact information, KYC status, messages, NDA records, listing activity, offer data, payment metadata, and support interactions."],
    ["DocuSign Storage", "Executed NDA documents and signature evidence may be stored by DocuSign and referenced in Treasure Planet records for access control and audit history."],
    ["UK GDPR Rights", "Users may request access, correction, deletion, restriction, portability, and objection subject to legal, security, and contractual retention limits."],
    ["Retention", "Deal, NDA, compliance, and payment records are retained for operational, tax, fraud prevention, and dispute management purposes."],
  ],
  "NDA Framework": [
    ["Mutual Scope", "The NDA is mutual. Seller product material, code, customer information, and commercial data are protected, and buyer strategy, budget, acquisition plans, and diligence notes are also protected."],
    ["Signing Method", "The NDA is signed via DocuSign and associated with the buyer, seller, listing, request, and timestamped signature record."],
    ["Term", "Confidentiality obligations last for a 5-year term from signature unless a longer duty applies to trade secrets or legally protected material."],
    ["Access Gate", "Signing does not guarantee access. Sellers approve or decline requests after reviewing the verified buyer profile and stated intent."],
    ["Breach", "Breach may result in permanent ban, access revocation, evidence preservation, and legal proceedings."],
  ],
  "AML Policy": [
    ["Six-Layer Framework", "Our AML framework covers identity verification, KYC gate, sanctions screening, payment monitoring, manual review, and record retention."],
    ["KYC Gate", "Buyers and sellers must pass verification before sensitive deal actions such as data room access, listing publication, or escrow movement."],
    ["MLRO", "A designated MLRO reviews escalations, suspicious indicators, sanctions alerts, and high-value transaction patterns."],
    ["Sanctions Screening", "Users and relevant payment parties may be screened against sanctions and watchlist data before or during deal activity."],
    ["Monitoring", "We monitor unusual pricing, repeated failed payments, inconsistent identities, and attempts to avoid platform controls."],
    ["Reporting", "Suspicious activity may be reported to competent authorities where required by applicable law."],
  ],
};

type DocName = keyof typeof docs;

export default function LegalPage() {
  const [tab, setTab] = useState<DocName>("Terms of Service");

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Legal</p>
          <h1 className="mt-3 font-display text-display-lg uppercase text-cream">Platform documents</h1>
        </header>
        <nav className="flex flex-wrap gap-3">
          {(Object.keys(docs) as DocName[]).map((doc) => (
            <button
              key={doc}
              className={`border px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] ${tab === doc ? "border-gold bg-gold-dim text-gold" : "border-border text-muted"}`}
              onClick={() => setTab(doc)}
              type="button"
            >
              {doc}
            </button>
          ))}
        </nav>
        <article className="space-y-6 border border-border bg-[rgba(7,15,26,0.78)] p-6">
          <h2 className="font-display text-display-sm uppercase text-gold">{tab}</h2>
          {docs[tab].map(([heading, body]) => (
            <section key={heading}>
              <h3 className="font-mono text-xs uppercase tracking-[0.16em] text-cream">{heading}</h3>
              <p className="mt-2 text-cream2">{body}</p>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
