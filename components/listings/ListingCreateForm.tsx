"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ListingCard } from "@/components/listings/ListingCard";
import { filterListingByTier } from "@/lib/listings/access";
import type { Json, Listing, ListingPlatform } from "@/types/database";

const platforms: { value: ListingPlatform; label: string }[] = [
  { value: "web", label: "Web app" },
  { value: "saas", label: "SaaS" },
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "macos", label: "macOS" },
  { value: "windows", label: "Windows" },
  { value: "ios-gaming", label: "iOS Gaming" },
  { value: "android-gaming", label: "Android Gaming" },
  { value: "pc-gaming", label: "PC Gaming" },
];

const dealTypeOptions = ["acquire", "co-found", "merge"];

type FormState = {
  platform: ListingPlatform;
  category_label: string;
  completion_pct: number;
  asking_price: string;
  deal_types: string[];
  tech_stack_input: string;
  public_summary: string;
  is_anonymous: boolean;
  requires_nda: boolean;
  accept_nda: boolean;
  dev_background: string;
  screenshots_input: string;
  demo_video_url: string;
  tech_stack_detail: string;
  commits_count: string;
  months_active: string;
  dev_timeline: string;
  project_name: string;
  source_code_url: string;
  architecture_doc: string;
  revenue_data: string;
  roadmap: string;
};

const defaultState: FormState = {
  platform: "web",
  category_label: "",
  completion_pct: 60,
  asking_price: "",
  deal_types: ["acquire"],
  tech_stack_input: "",
  public_summary: "",
  is_anonymous: true,
  requires_nda: true,
  accept_nda: false,
  dev_background: "",
  screenshots_input: "",
  demo_video_url: "",
  tech_stack_detail: "",
  commits_count: "",
  months_active: "",
  dev_timeline: "",
  project_name: "",
  source_code_url: "",
  architecture_doc: "",
  revenue_data: "",
  roadmap: "",
};

const steps = ["Public", "Registered", "Private", "Preview"];

export function ListingCreateForm({ sellerName }: { sellerName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(defaultState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewListing = useMemo<Listing>(() => buildPreviewListing(form, sellerName), [form, sellerName]);

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validatePublicStep() {
    if (!form.category_label || !form.asking_price || !form.public_summary || form.tech_stack_input.trim() === "") {
      setError("Complete the public listing fields before continuing.");
      return false;
    }

    setError(null);
    return true;
  }

  function nextStep() {
    if (step === 0 && !validatePublicStep()) {
      return;
    }

    setStep((current) => Math.min(current + 1, steps.length - 1));
  }

  async function submit(publish: boolean) {
    if (!validatePublicStep()) {
      return;
    }

    if (form.requires_nda && !form.accept_nda) {
      setStep(0);
      setError("Accept the mutual NDA terms, or switch off the NDA requirement.");
      return;
    }

    if (publish && !form.project_name.trim()) {
      setStep(2);
      setError("Add a project name before publishing.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/listings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(toPayload(form, sellerName, publish)),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(typeof payload.error === "string" ? payload.error : "Unable to save listing.");
      setIsSubmitting(false);
      return;
    }

    router.push(publish ? "/marketplace" : "/dashboard/seller");
    router.refresh();
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="border-b border-border pb-6">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">New listing</p>
          <h1 className="mt-2 font-display text-display-lg uppercase text-cream">Prepare a project listing</h1>
          <p className="mt-3 max-w-2xl text-cream2">
            Build each visibility tier carefully. You choose what is public, registered buyers see more signal,
            and buyers you approve unlock the private details.
          </p>
        </header>

        <nav className="grid gap-3 sm:grid-cols-4">
          {steps.map((label, index) => (
            <button
              key={label}
              type="button"
              className={`border px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] ${
                step === index ? "border-border2 bg-gold-dim text-gold" : "border-border text-muted"
              }`}
              onClick={() => setStep(index)}
            >
              {index + 1}. {label}
            </button>
          ))}
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="border border-border bg-[rgba(7,15,26,0.9)] p-6 backdrop-blur-3xl">
            {step === 0 && <PublicStep form={form} update={update} />}
            {step === 1 && <RegisteredStep form={form} update={update} />}
            {step === 2 && <NdaStep form={form} update={update} />}
            {step === 3 && <PreviewStep listing={previewListing} />}

            {error && <p className="mt-5 font-mono text-xs uppercase tracking-[0.14em] text-red">{error}</p>}

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                className="border border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-cream2 transition hover:border-border2 hover:text-gold"
                onClick={() => setStep((current) => Math.max(current - 1, 0))}
              >
                Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  type="button"
                  className="btn-liquid px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
                  onClick={nextStep}
                >
                  Continue
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="border border-border px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] text-cream2 transition hover:border-border2 hover:text-gold disabled:opacity-60"
                    onClick={() => submit(false)}
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    className="btn-liquid px-5 py-3 font-mono text-xs uppercase tracking-[0.16em] disabled:opacity-60"
                    onClick={() => submit(true)}
                  >
                    Publish
                  </button>
                </>
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">Live card preview</p>
            {/* Filtered exactly as the server filters it, so the preview shows what the public will see. */}
            <ListingCard listing={filterListingByTier(previewListing, "public")} accessTier="public" />
          </aside>
        </section>
      </div>
    </main>
  );
}

function PublicStep({ form, update }: StepProps) {
  return (
    <div className="space-y-5">
      <StepTitle title="Public tier" text="This is visible in the marketplace before a buyer signs in." />
      <SelectField label="Platform" value={form.platform} onChange={(value) => update("platform", value as ListingPlatform)}>
        {platforms.map((platform) => (
          <option key={platform.value} value={platform.value}>
            {platform.label}
          </option>
        ))}
      </SelectField>
      <TextField label="Category label" value={form.category_label} onChange={(value) => update("category_label", value)} />
      <label className="block">
        <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">
          Completion: {form.completion_pct}%
        </span>
        <input
          type="range"
          min="0"
          max="100"
          value={form.completion_pct}
          onChange={(event) => update("completion_pct", Number(event.target.value))}
          className="w-full accent-gold"
        />
      </label>
      <TextField
        label="Asking price GBP"
        value={form.asking_price}
        onChange={(value) => update("asking_price", value)}
        type="number"
      />
      <fieldset>
        <legend className="mb-2 font-mono text-xs uppercase tracking-[0.14em] text-muted">Deal types</legend>
        <div className="flex flex-wrap gap-3">
          {dealTypeOptions.map((deal) => (
            <label key={deal} className="flex items-center gap-2 border border-border px-3 py-2 text-cream2">
              <input
                type="checkbox"
                checked={form.deal_types.includes(deal)}
                onChange={(event) => {
                  update(
                    "deal_types",
                    event.target.checked
                      ? [...form.deal_types, deal]
                      : form.deal_types.filter((item) => item !== deal),
                  );
                }}
              />
              <span className="font-mono text-xs uppercase tracking-[0.14em]">{deal}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextField label="Tech stack tags" value={form.tech_stack_input} onChange={(value) => update("tech_stack_input", value)} />
      <TextArea label="Public summary" value={form.public_summary} onChange={(value) => update("public_summary", value)} />
      <label className="flex items-center justify-between border border-border bg-[rgba(4,9,15,0.8)] px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Anonymous listing</span>
        <input
          type="checkbox"
          checked={form.is_anonymous}
          onChange={(event) => update("is_anonymous", event.target.checked)}
          className="h-5 w-5 accent-gold"
        />
      </label>
      <p className="-mt-3 text-sm text-muted">
        {form.is_anonymous
          ? "The project name and your name stay hidden until you approve a buyer."
          : "The project name and your name are shown publicly on the listing."}
      </p>
      <label className="flex items-center justify-between border border-border bg-[rgba(4,9,15,0.8)] px-4 py-3">
        <span className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Require buyers to sign the mutual NDA</span>
        <input
          type="checkbox"
          checked={form.requires_nda}
          onChange={(event) => update("requires_nda", event.target.checked)}
          className="h-5 w-5 accent-gold"
        />
      </label>
      {form.requires_nda ? (
        <label className="flex items-start gap-3 text-cream2">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 accent-gold"
            checked={form.accept_nda}
            onChange={(event) => update("accept_nda", event.target.checked)}
          />
          <span>
            I have read the{" "}
            <a className="text-gold hover:text-gold2" href="/legal" target="_blank" rel="noreferrer">
              mutual NDA
            </a>{" "}
            and agree to be bound by it with each buyer I approve for this listing.
          </span>
        </label>
      ) : (
        <p className="-mt-3 text-sm text-muted">
          Buyers can request access without signing anything. You still approve each request, but nothing you share
          is covered by a confidentiality agreement.
        </p>
      )}
    </div>
  );
}

function RegisteredStep({ form, update }: StepProps) {
  return (
    <div className="space-y-5">
      <StepTitle title="Registered tier" text="This tier adds deeper product and technical signal for signed-in buyers." />
      <TextArea label="Developer background" value={form.dev_background} onChange={(value) => update("dev_background", value)} />
      <TextField
        label="Screenshot URLs"
        value={form.screenshots_input}
        onChange={(value) => update("screenshots_input", value)}
      />
      <TextField label="Demo video URL" value={form.demo_video_url} onChange={(value) => update("demo_video_url", value)} />
      <TextArea
        label="Tech stack detail"
        value={form.tech_stack_detail}
        onChange={(value) => update("tech_stack_detail", value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Commits count"
          value={form.commits_count}
          onChange={(value) => update("commits_count", value)}
          type="number"
        />
        <TextField
          label="Months active"
          value={form.months_active}
          onChange={(value) => update("months_active", value)}
          type="number"
        />
      </div>
      <TextArea label="Development timeline" value={form.dev_timeline} onChange={(value) => update("dev_timeline", value)} />
    </div>
  );
}

function NdaStep({ form, update }: StepProps) {
  return (
    <div className="space-y-5">
      <StepTitle title="Private tier" text="Only buyers you approve can see these fields." />
      <TextField label="Project name" value={form.project_name} onChange={(value) => update("project_name", value)} />
      <TextField
        label="Repository or demo link (optional)"
        value={form.source_code_url}
        onChange={(value) => update("source_code_url", value)}
      />
      <p className="-mt-3 text-sm text-muted">
        Do not paste source code or secrets here. Every approved buyer can see this link, so use one that still needs
        you to grant access (for example a private repository), and invite a buyer yourself once you trust them.
      </p>
      <TextArea label="Architecture doc" value={form.architecture_doc} onChange={(value) => update("architecture_doc", value)} />
      <TextArea label="Revenue data" value={form.revenue_data} onChange={(value) => update("revenue_data", value)} />
      <TextArea label="Roadmap" value={form.roadmap} onChange={(value) => update("roadmap", value)} />
    </div>
  );
}

function PreviewStep({ listing }: { listing: Listing }) {
  return (
    <div className="space-y-5">
      <StepTitle title="Preview" text="Review how the listing changes across the three access tiers." />
      <ListingCard listing={filterListingByTier(listing, "public")} accessTier="public" />
      <ListingCard listing={filterListingByTier(listing, "registered")} accessTier="registered" />
      <ListingCard listing={filterListingByTier(listing, "nda")} accessTier="nda" />
    </div>
  );
}

type StepProps = {
  form: FormState;
  update: <Key extends keyof FormState>(key: Key, value: FormState[Key]) => void;
};

function StepTitle({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="font-display text-display-sm uppercase text-cream">{title}</h2>
      <p className="mt-2 text-cream2">{text}</p>
    </div>
  );
}

function TextField({
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

function SelectField({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
      <select className="auth-input" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-[0.14em] text-muted">{label}</span>
      <textarea className="auth-input min-h-32" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function buildPreviewListing(form: FormState, sellerName: string): Listing {
  return {
    id: "preview-listing",
    seller_id: "preview-seller",
    platform: form.platform,
    category_label: form.category_label || "Category",
    completion_pct: form.completion_pct,
    asking_price_gbp: Math.round(Number(form.asking_price || 0) * 100),
    deal_types: form.deal_types,
    tech_stack: splitList(form.tech_stack_input),
    public_summary: form.public_summary || "Your public summary will appear here.",
    status: "draft",
    is_anonymous: form.is_anonymous,
    requires_nda: form.requires_nda,
    seller_nda_version: null,
    seller_nda_accepted_at: null,
    views_count: 0,
    dev_background: form.dev_background || null,
    screenshots_urls: splitList(form.screenshots_input),
    demo_video_url: form.demo_video_url || null,
    tech_stack_detail: form.tech_stack_detail || null,
    git_stats: {
      commits: Number(form.commits_count || 0),
      months_active: Number(form.months_active || 0),
    },
    dev_timeline: form.dev_timeline || null,
    project_name: form.project_name || null,
    source_code_url: form.source_code_url || null,
    architecture_doc: form.architecture_doc || null,
    revenue_data: parseLooseJson(form.revenue_data),
    roadmap: form.roadmap || null,
    seller_name: sellerName || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    listed_at: null,
    sold_at: null,
  };
}

function toPayload(form: FormState, sellerName: string, publish: boolean) {
  const listing = buildPreviewListing(form, sellerName);

  return {
    platform: listing.platform,
    category_label: listing.category_label,
    completion_pct: listing.completion_pct,
    asking_price_gbp: listing.asking_price_gbp,
    deal_types: listing.deal_types,
    tech_stack: listing.tech_stack,
    public_summary: listing.public_summary,
    is_anonymous: listing.is_anonymous,
    requires_nda: listing.requires_nda,
    accept_nda: form.accept_nda,
    dev_background: listing.dev_background,
    screenshots_urls: listing.screenshots_urls,
    demo_video_url: listing.demo_video_url,
    tech_stack_detail: listing.tech_stack_detail,
    git_stats: listing.git_stats,
    dev_timeline: listing.dev_timeline,
    project_name: listing.project_name,
    source_code_url: listing.source_code_url,
    architecture_doc: listing.architecture_doc,
    revenue_data: listing.revenue_data,
    roadmap: listing.roadmap,
    seller_name: listing.seller_name,
    publish,
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseLooseJson(value: string): Json {
  if (!value.trim()) {
    return {};
  }

  try {
    return JSON.parse(value) as Json;
  } catch {
    return { notes: value };
  }
}
