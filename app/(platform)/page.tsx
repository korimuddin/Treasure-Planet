import Link from "next/link";

const trustStats = [
  ["⚓", "247", "Anonymous Listings"],
  ["🔐", "Mutual", "NDA on Every Deal"],
  ["🛡️", "Seller", "Controls Access"],
  ["💰", "10%", "Fee on Close Only"],
  ["🚢", "£1.2M", "Value Transacted"],
];

export default function HomePage() {
  return (
    <main className="relative isolate overflow-hidden bg-ink">
      <section className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div
            className="mx-auto flex max-w-md items-center gap-4 opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{ animationDelay: "0.2s" }}
          >
            <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--teal2))]" />
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-teal2">
              Ancient Code · New Horizons
            </p>
            <span className="h-px flex-1 bg-[linear-gradient(90deg,var(--teal2),transparent)]" />
          </div>

          <p
            className="mt-7 text-3xl italic text-cream2 opacity-0 [animation:fade-up_700ms_ease_forwards] sm:text-4xl"
            style={{ animationDelay: "0.35s" }}
          >
            Find Hidden Treasure
          </p>
          <h1
            className="royal-gradient-text mt-2 font-display text-[clamp(4rem,16vw,8rem)] uppercase leading-[0.85] opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{
              animationDelay: "0.45s",
              textShadow: "0 0 26px rgba(117,170,255,0.28), 0 0 72px rgba(14,95,255,0.18)",
            }}
          >
            IN THE DEPTHS
          </h1>
          <p
            className="mt-2 text-3xl italic text-cream2 opacity-0 [animation:fade-up_700ms_ease_forwards] sm:text-4xl"
            style={{ animationDelay: "0.55s" }}
          >
            of abandoned software
          </p>
          <p
            className="mx-auto mt-7 max-w-2xl text-xl leading-8 text-cream2 opacity-0 [animation:fade-up_700ms_ease_forwards] sm:text-2xl"
            style={{ animationDelay: "0.65s" }}
          >
            Thousands of projects are shipwrecked — fully built, never launched. Buy them, revive them, or find a
            cofounder to finish what was started.
          </p>
          <p
            className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[rgba(200,168,75,0.4)] opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{ animationDelay: "0.72s" }}
          >
            Every deal protected by our mutual NDA
          </p>
          <div className="mt-9 opacity-0 [animation:fade-up_700ms_ease_forwards]" style={{ animationDelay: "0.8s" }}>
            <Link
              href="/marketplace"
              className="btn-liquid inline-flex items-center gap-3 border-border2 px-6 py-4 font-mono text-xs uppercase tracking-[0.18em] text-cream"
            >
              Enter the Depths
              <svg aria-hidden="true" width="14" height="18" viewBox="0 0 14 18" fill="none">
                <path d="M7 1v14M2 10l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          <div
            className="mt-14 flex flex-col items-center gap-3 opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{ animationDelay: "1.2s" }}
          >
            <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-muted">Descend</p>
            <span className="relative h-12 w-px overflow-hidden bg-border">
              <span className="absolute left-0 top-0 h-4 w-px bg-gold [animation:scroll-drop_1.8s_ease-in-out_infinite]" />
            </span>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-border bg-[rgba(7,15,26,0.8)] backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-3 overflow-x-auto lg:grid-cols-5">
          {trustStats.map(([emoji, value, label], index) => (
            <div
              key={label}
              className={`min-w-[180px] px-4 py-5 text-center ${index > 0 ? "border-l border-border" : ""} ${
                index > 2 ? "hidden lg:block" : ""
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {emoji}
              </span>
              <p className="mt-1 font-display text-lg uppercase text-gold">{value}</p>
              <p className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
