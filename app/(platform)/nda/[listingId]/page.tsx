import Link from "next/link";
import { redirect } from "next/navigation";
import { NdaRequestForm } from "@/components/nda/NdaRequestForm";
import { previewListings } from "@/lib/listings/sample";
import { NDA_TEXT } from "@/lib/nda/template";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NdaPage({ params }: { params: { listingId: string } }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const listing = previewListings.find((item) => item.id === params.listingId) ?? previewListings[0];
    return <NdaRequestForm listing={listing} buyerName="" ndaText={NDA_TEXT} previewMode />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?redirectedFrom=/nda/${params.listingId}`);
  }

  // Public columns only: this runs with the visitor's own (RLS-limited) session.
  const [{ data: profile }, { data: listing }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase
      .from("listings")
      .select("id, seller_id, category_label, asking_price_gbp, requires_nda")
      .eq("id", params.listingId)
      .eq("status", "live")
      .single(),
  ]);

  if (!listing || listing.seller_id === user.id) {
    return (
      <Notice
        eyebrow="Access request"
        title={listing ? "This is your own listing" : "Listing not found"}
        linkHref="/marketplace"
        linkLabel="Back to marketplace"
      />
    );
  }

  if (!user.email_confirmed_at) {
    return (
      <Notice
        eyebrow="Confirm your email"
        title="Check your inbox first"
        body="Confirm your email address using the link we sent you, then come back to request access."
        linkHref="/marketplace"
        linkLabel="Back to marketplace"
      />
    );
  }

  return <NdaRequestForm listing={listing} buyerName={profile?.full_name ?? ""} ndaText={NDA_TEXT} />;
}

function Notice({
  eyebrow,
  title,
  body,
  linkHref,
  linkLabel,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <main className="min-h-screen px-6 py-12">
      <section className="mx-auto max-w-2xl border border-border bg-[rgba(7,15,26,0.96)] p-8">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
        <h1 className="mt-4 font-display text-display-sm uppercase text-cream">{title}</h1>
        {body && <p className="mt-3 text-cream2">{body}</p>}
        <Link className="mt-6 inline-flex text-gold" href={linkHref}>
          {linkLabel}
        </Link>
      </section>
    </main>
  );
}
