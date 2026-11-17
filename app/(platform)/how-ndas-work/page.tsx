const cards = [
  ["What Is the NDA?", "A mutual confidentiality agreement between buyer and seller, signed before private listing details are shown. Sellers can switch it off for a listing."],
  ["Why Mutual?", "Sellers protect product assets while buyers protect strategy, budget, and acquisition intent."],
  ["Seller Approval Gate", "Signing starts the review; the seller still decides whether the buyer enters the data room."],
  ["What We Record", "The name typed, the time, the IP address, and the exact wording. Both parties get a copy by email. Enforcing the agreement is between the two parties."],
];

const steps = ["Browse", "Sign", "Request", "Seller Review", "Private Details", "Deal Chat"];

const rows = [
  ["One-sided protection", "Mutual protection"],
  ["Automatic access", "Seller approval"],
  ["No context on the buyer", "Name, budget and message"],
  ["No record kept", "Timestamped copy emailed to both"],
];

export default function HowNdasWorkPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Mutual NDA</p>
          <h1 className="mt-3 font-display text-display-lg uppercase text-cream">How NDAs work</h1>
          <p className="mt-4 max-w-3xl text-cream2">
            By default, buyers sign a mutual NDA and the seller approves them before private project details are revealed.
          </p>
        </header>

        <section className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4">
          {cards.map(([title, text]) => (
            <article key={title} className="border border-border bg-[rgba(7,15,26,0.78)] p-5">
              <h2 className="font-display text-3xl uppercase text-gold">{title}</h2>
              <p className="mt-3 text-cream2">{text}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-6">
          {steps.map((step, index) => (
            <div key={step} className="relative">
              <span className="grid h-11 w-11 place-items-center rounded-full border border-gold bg-gold-dim font-display text-2xl text-gold">
                {index + 1}
              </span>
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">{step}</p>
            </div>
          ))}
        </section>

        <section className="overflow-hidden border border-border">
          <div className="grid grid-cols-2 bg-ink2 font-mono text-xs uppercase tracking-[0.16em] text-gold">
            <div className="border-r border-border p-4">No agreement</div>
            <div className="p-4">Treasure Planet Mutual NDA</div>
          </div>
          {rows.map(([left, right]) => (
            <div key={left} className="grid grid-cols-2 border-t border-border text-cream2">
              <div className="border-r border-border p-4">{left}</div>
              <div className="p-4">{right}</div>
            </div>
          ))}
        </section>

        <section className="border border-teal-dim bg-teal-dim p-6">
          <h2 className="font-display text-display-sm uppercase text-teal2">Simple. Mutual. Protected.</h2>
          <p className="mt-2 text-cream2">
            Clear signing, a record for both sides, and seller approval keep the process focused.
          </p>
        </section>
      </div>
    </main>
  );
}
