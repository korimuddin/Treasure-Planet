"use client";

import { useState } from "react";

const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "hello@treasureplanet.io";

// PLAIN-ENGLISH STARTER TERMS. These describe what the site actually does.
// They have not been reviewed by a solicitor: get them checked when you can,
// and keep them in step with the product whenever behaviour changes.
const docs = {
  "Terms of Service": [
    ["What Treasure Planet is", "Treasure Planet is an online marketplace where people list unfinished or dormant software projects and other people ask to buy, co-found or merge them. We provide the listing, messaging, agreement-recording and payment tools. We are not a party to any deal, we do not own or inspect the projects, and we do not give legal, financial or tax advice."],
    ["Accounts", "You must give accurate details and confirm your email address. You are responsible for what happens under your account. We may suspend accounts that mislead other users, misuse private material, or try to get around the site's rules."],
    ["Listings", "Sellers must own, or have the right to sell, everything they list, and must describe it honestly. Sellers choose whether a listing is anonymous and whether buyers must sign the mutual NDA. We do not verify ownership, code quality, revenue or any other claim in a listing. Buyers should do their own checks before paying."],
    ["Payments", "Purchases are paid through Stripe, our payment provider. The buyer pays the agreed price in full. Stripe holds the payment and it is released to the seller only when the buyer confirms they have received the project. Treasure Planet never holds your money itself. Co-found and merge arrangements are not paid through the site."],
    ["Our fee", "We charge the seller 10% of the purchase price, deducted when the payment is released. There are no listing fees. If a deal is refunded before release, no fee is charged."],
    ["Problems and refunds", "While a payment is held, either party can report a problem. The payment then stays held while we review the messages and evidence in the deal, and we decide whether to release it to the seller or refund the buyer. If the seller marks the project as transferred and the buyer neither confirms nor reports a problem within 7 days, we may release the payment. Once a payment has been released it cannot be reversed by us."],
    ["Conduct", "Deal honestly, keep private material private, and do not harass, spam or attempt to take a deal off the site to avoid the fee after being introduced here."],
    ["Liability", "The site is provided as it is. To the extent the law allows, we are not responsible for losses arising from deals between users, from inaccurate listings, or from a user breaking an agreement with another user. Nothing here limits liability that cannot legally be limited."],
  ],
  "Privacy Policy": [
    ["Who we are", "Treasure Planet decides how your personal data is used for the purposes below (we are the controller). Contact us at " + contactEmail + "."],
    ["What we collect", "Your name, email address, country and company (if given); your listings, access requests, messages and deals; a record of any NDA you sign, including the name you typed, the time and your IP address; and basic usage and error data."],
    ["Payments and seller checks", "Payment details are collected and processed by Stripe, not by us. Sellers who want to be paid are verified by Stripe directly. We receive confirmation of the result, not your identity documents."],
    ["Who we share it with", "The other party to your request or deal sees what is needed to deal with you (for example, your name on a signed NDA). We use service providers to run the site: Supabase (database and sign-in), Stripe (payments), Resend (email), Netlify (hosting), Sentry (error reports) and PostHog (usage analytics)."],
    ["How long we keep it", "For as long as your account is open. If you delete your account we remove your personal details, but keep deal, payment and signed-agreement records where we need them for tax, disputes or the other party's records."],
    ["Your rights", "Under UK data protection law you can ask for a copy of your data, ask us to correct or delete it, and object to or restrict how we use it. You can also complain to the Information Commissioner's Office (ico.org.uk)."],
  ],
  "Mutual NDA": [
    ["When it applies", "Each seller decides whether buyers must sign the mutual NDA before requesting access to a listing's private details. Listings show which applies."],
    ["Who it is between", "The NDA is an agreement between the buyer and the seller only. Treasure Planet records it but is not a party to it, and cannot enforce it on anyone's behalf. If the other party breaks it, any claim is yours to bring."],
    ["How it is signed", "The buyer signs by typing their full legal name and ticking a box. The seller accepts the same terms when publishing the listing and by approving the buyer. We record the name, time, IP address and the exact wording agreed, and email a copy to both parties."],
    ["What we do not promise", "We do not verify the identity of buyers. A signed NDA discourages misuse and gives you a record, but it cannot physically stop someone copying what you show them. Share only what you are comfortable sharing, and consider granting repository access yourself, directly, once you trust the buyer."],
    ["Signing is not access", "Signing the NDA sends a request. The seller still approves or declines it."],
    ["The wording", "The full agreement is shown on the request page before you sign."],
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
