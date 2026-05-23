"use client";

import { ArrowRight, CheckCircle2, CreditCard, FileText, Handshake, LockKeyhole, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

type DemoListing = {
  id: string;
  title: string;
  platform: "iOS" | "Android" | "Web" | "Windows" | "Gaming";
  price: number;
  completion: number;
  tags: string[];
  summary: string;
  sellerFit: string;
};

const listings: DemoListing[] = [
  {
    id: "inventory-ai",
    title: "Redacted SaaS Inventory Tool",
    platform: "Web",
    price: 42000,
    completion: 82,
    tags: ["SaaS", "AI", "B2B", "React"],
    summary: "A nearly complete operations tool with working dashboards, import flows, and early customer notes.",
    sellerFit: "Best for a buyer who can add sales motion and integrations.",
  },
  {
    id: "habit-ios",
    title: "Anonymous Habit App",
    platform: "iOS",
    price: 18000,
    completion: 68,
    tags: ["Mobile", "Health", "Swift", "Subscriptions"],
    summary: "A polished mobile build with onboarding, streak logic, and subscription screens ready for testing.",
    sellerFit: "Best for a buyer who understands consumer growth and app-store launch work.",
  },
  {
    id: "game-engine",
    title: "Hidden Puzzle Game",
    platform: "Gaming",
    price: 56000,
    completion: 74,
    tags: ["Unity", "Game", "Puzzle", "Steam"],
    summary: "A playable game loop with level editor, art direction, and enough content for a vertical slice.",
    sellerFit: "Best for a studio that can finish production and publishing.",
  },
  {
    id: "field-android",
    title: "Field Ops Android Build",
    platform: "Android",
    price: 31000,
    completion: 79,
    tags: ["Mobile", "Logistics", "Kotlin", "B2B"],
    summary: "A field-team app with offline capture, sync states, and admin review screens.",
    sellerFit: "Best for a buyer with logistics contacts or enterprise pilots.",
  },
];

const allTags = ["AI", "B2B", "Game", "Health", "Kotlin", "Mobile", "React", "SaaS", "Subscriptions", "Unity"];
const platforms = ["All", "iOS", "Android", "Web", "Windows", "Gaming"] as const;

const saleSteps = [
  {
    title: "Search the marketplace",
    icon: Search,
    label: "Filter by platform, tags, price, completion, and deal shape until the short list feels real.",
    action: "Pick a listing from the filtered results.",
  },
  {
    title: "View the public summary",
    icon: SlidersHorizontal,
    label: "Review the anonymous public tier: platform, completion, price, tags, summary, and hidden-content signals.",
    action: "Use the summary to decide whether deeper access is worth requesting.",
  },
  {
    title: "Sign the mutual NDA",
    icon: ShieldCheck,
    label: "Submit buyer identity, budget, intent, and sign the mutual NDA before private material is revealed.",
    action: "The seller receives your verified profile and request context.",
  },
  {
    title: "Seller approves access",
    icon: LockKeyhole,
    label: "The seller reviews fit, budget range, and message before unlocking the data room.",
    action: "Approved buyers can inspect the project name, docs, roadmap, and data room content.",
  },
  {
    title: "Send LOI and fund escrow",
    icon: FileText,
    label: "Agree price, deal type, and closing conditions. Once the LOI is accepted, payment moves into escrow.",
    action: "Funds stay held while source, assets, and transfer steps are completed.",
  },
  {
    title: "Confirm transfer and close",
    icon: CreditCard,
    label: "Seller confirms delivery, buyer confirms receipt, funds are released, and the listing is marked sold.",
    action: "Both sides leave with a complete record of the deal.",
  },
];

export default function OnboardingDemoPage() {
  const [query, setQuery] = useState("");
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("All");
  const [maxPrice, setMaxPrice] = useState(60000);
  const [selectedTags, setSelectedTags] = useState<string[]>(["SaaS"]);
  const [selectedId, setSelectedId] = useState(listings[0].id);
  const [activeStep, setActiveStep] = useState(0);

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesPlatform = platform === "All" || listing.platform === platform;
      const matchesPrice = listing.price <= maxPrice;
      const matchesTags = selectedTags.length === 0 || selectedTags.every((tag) => listing.tags.includes(tag));
      const matchesQuery =
        !normalizedQuery ||
        listing.title.toLowerCase().includes(normalizedQuery) ||
        listing.summary.toLowerCase().includes(normalizedQuery) ||
        listing.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery));

      return matchesPlatform && matchesPrice && matchesTags && matchesQuery;
    });
  }, [maxPrice, platform, query, selectedTags]);

  const selectedListing = filteredListings.find((listing) => listing.id === selectedId) ?? filteredListings[0] ?? listings[0];
  const progressPct = Math.round(((activeStep + 1) / saleSteps.length) * 100);

  function toggleTag(tag: string) {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
  }

  function selectListing(listing: DemoListing) {
    setSelectedId(listing.id);
    setActiveStep(1);
  }

  return (
    <main className="min-h-screen px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="royal-glass p-6 sm:p-8">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted">Buyer onboarding demo</p>
          <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
            <div>
              <h1 className="royal-gradient-text font-display text-display-lg uppercase">How a sale works</h1>
              <p className="mt-4 max-w-3xl text-lg leading-7 text-cream2">
                Walk through the buyer journey from search and filtering to mutual NDA, seller approval, LOI, escrow,
                transfer, and close.
              </p>
            </div>
            <div className="border border-border bg-[rgba(255,255,255,0.08)] p-4">
              <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                <span>Demo progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="mt-3 h-2 border border-border bg-[rgba(2,7,18,0.42)]">
                <div className="h-full bg-[linear-gradient(90deg,#ffffff,#75aaff,#0e5fff)]" style={{ width: `${progressPct}%` }} />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[380px_1fr]">
          <aside className="royal-glass p-5">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <Search aria-hidden="true" className="h-5 w-5 text-cream" />
              <div>
                <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-cream">Search controls</h2>
                <p className="mt-1 text-sm text-muted">Try filtering like a first-time buyer.</p>
              </div>
            </div>

            <div className="mt-5 space-y-5">
              <label className="block">
                <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  Keyword or tag
                </span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="auth-input"
                  placeholder="Try AI, mobile, game..."
                />
              </label>

              <label className="block">
                <span className="mb-2 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  Platform
                </span>
                <select className="auth-input" value={platform} onChange={(event) => setPlatform(event.target.value as typeof platform)}>
                  {platforms.map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 flex justify-between font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                  <span>Max price</span>
                  <span>£{maxPrice.toLocaleString("en-GB")}</span>
                </span>
                <input
                  type="range"
                  min="10000"
                  max="65000"
                  step="1000"
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="w-full accent-[#75aaff]"
                />
              </label>

              <div>
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {allTags.map((tag) => {
                    const active = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.12em] ${
                          active ? "border-border2 bg-gold-dim text-cream" : "border-border bg-[rgba(2,7,18,0.34)] text-muted"
                        }`}
                        onClick={() => toggleTag(tag)}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </aside>

          <section className="grid gap-5 xl:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-mono text-xs font-black uppercase tracking-[0.18em] text-cream">
                  {filteredListings.length} matching listings
                </h2>
                <button
                  type="button"
                  className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted hover:text-cream"
                  onClick={() => {
                    setQuery("");
                    setPlatform("All");
                    setMaxPrice(60000);
                    setSelectedTags([]);
                  }}
                >
                  Reset filters
                </button>
              </div>

              {filteredListings.map((listing) => (
                <button
                  key={listing.id}
                  type="button"
                  className={`royal-glass block w-full p-5 text-left transition ${
                    selectedListing.id === listing.id ? "border-border2 shadow-[0_20px_80px_rgba(14,95,255,0.24)]" : ""
                  }`}
                  onClick={() => selectListing(listing)}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                        {listing.platform} / {listing.completion}% complete
                      </p>
                      <h3 className="mt-2 font-display text-3xl uppercase text-cream">{listing.title}</h3>
                      <p className="mt-2 max-w-2xl text-cream2">{listing.summary}</p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <p className="royal-gradient-text font-display text-4xl uppercase">£{listing.price.toLocaleString("en-GB")}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">asking price</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {listing.tags.map((tag) => (
                      <span key={tag} className="border border-border bg-[rgba(255,255,255,0.06)] px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}

              {filteredListings.length === 0 && (
                <div className="royal-glass p-8 text-center text-cream2">
                  No demo listings match those filters. Reset or loosen one filter to continue the walkthrough.
                </div>
              )}
            </div>

            <aside className="royal-glass p-5 xl:sticky xl:top-24 xl:self-start">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Selected opportunity</p>
              <h2 className="mt-2 font-display text-3xl uppercase text-cream">{selectedListing.title}</h2>
              <p className="mt-3 text-cream2">{selectedListing.sellerFit}</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <MiniMetric label="Platform" value={selectedListing.platform} />
                <MiniMetric label="Complete" value={`${selectedListing.completion}%`} />
                <MiniMetric label="Price" value={`£${selectedListing.price.toLocaleString("en-GB")}`} />
                <MiniMetric label="Tags" value={String(selectedListing.tags.length)} />
              </div>
              <button
                type="button"
                className="btn-liquid mt-5 inline-flex w-full items-center justify-center gap-2 px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
                onClick={() => setActiveStep(Math.min(activeStep + 1, saleSteps.length - 1))}
              >
                Continue walkthrough
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </button>
            </aside>
          </section>
        </section>

        <section className="royal-glass p-5 sm:p-7">
          <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-muted">Six steps to close</p>
              <h2 className="royal-gradient-text mt-2 font-display text-display-md uppercase">From discovery to completed sale</h2>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
              <Handshake aria-hidden="true" className="h-4 w-4 text-cream" />
              Mutual NDA before private data room access
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {saleSteps.map((step, index) => {
              const Icon = step.icon;
              const active = activeStep === index;
              const done = activeStep > index;

              return (
                <button
                  key={step.title}
                  type="button"
                  className={`border p-4 text-left ${
                    active
                      ? "border-border2 bg-gold-dim text-cream shadow-[0_20px_70px_rgba(14,95,255,0.22)]"
                      : done
                        ? "border-border bg-teal-dim text-cream"
                        : "border-border bg-[rgba(2,7,18,0.28)] text-muted"
                  }`}
                  onClick={() => setActiveStep(index)}
                >
                  <div className="flex items-center justify-between">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                    {done ? <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-cream" /> : <span className="font-mono text-[10px]">0{index + 1}</span>}
                  </div>
                  <p className="mt-4 font-mono text-[10px] font-black uppercase tracking-[0.14em]">{step.title}</p>
                </button>
              );
            })}
          </div>

          <article className="mt-6 grid gap-6 border border-border bg-[rgba(2,7,18,0.36)] p-5 lg:grid-cols-[1fr_320px]">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                Step {activeStep + 1} of {saleSteps.length}
              </p>
              <h3 className="mt-2 font-display text-display-sm uppercase text-cream">{saleSteps[activeStep].title}</h3>
              <p className="mt-3 text-lg leading-7 text-cream2">{saleSteps[activeStep].label}</p>
              <p className="mt-4 border border-border bg-[rgba(255,255,255,0.06)] px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                {saleSteps[activeStep].action}
              </p>
            </div>
            <div className="border border-border bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(24,91,220,0.20))] p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-muted">Deal state</p>
              <div className="mt-4 space-y-3">
                {["Public listing", "Mutual NDA", "Seller approval", "Data room", "LOI", "Escrow", "Closed"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className={`h-2 w-2 ${index <= activeStep ? "bg-cream" : "bg-muted2"}`} />
                    <span className={`font-mono text-[10px] uppercase tracking-[0.14em] ${index <= activeStep ? "text-cream" : "text-muted"}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-[rgba(255,255,255,0.06)] p-3">
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm font-black uppercase tracking-[0.08em] text-cream">{value}</p>
    </div>
  );
}
