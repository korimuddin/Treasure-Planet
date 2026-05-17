import Link from "next/link";
import { redirect } from "next/navigation";
import { NdaRequestForm } from "@/components/nda/NdaRequestForm";
import { previewListings } from "@/lib/listings/sample";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NdaPage({ params }: { params: { listingId: string } }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const listing = previewListings.find((item) => item.id === params.listingId) ?? previewListings[0];
    return <NdaRequestForm listing={listing} buyerEmail="" buyerName="" previewMode />;
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: listing }] = await Promise.all([
    supabase.from("profiles").select("full_name, email, kyc_status").eq("id", user.id).single(),
    supabase
      .from("listings")
      .select("id, category_label, asking_price_gbp, platform, completion_pct, public_summary, tech_stack")
      .eq("id", params.listingId)
      .eq("status", "live")
      .single(),
  ]);

  if (!listing) {
    return (
      <main className="min-h-screen px-6 py-12">
        <section className="mx-auto max-w-2xl border border-border bg-[rgba(7,15,26,0.96)] p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">NDA access</p>
          <h1 className="mt-4 font-display text-display-sm uppercase text-cream">Listing not found</h1>
          <Link className="mt-6 inline-flex text-gold" href="/marketplace">
            Back to marketplace
          </Link>
        </section>
      </main>
    );
  }

  if (profile?.kyc_status !== "verified") {
    return (
      <main className="min-h-screen px-6 py-12">
        <section className="mx-auto max-w-2xl border border-border bg-[rgba(7,15,26,0.96)] p-8">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Verification required</p>
          <h1 className="mt-4 font-display text-display-sm uppercase text-cream">Verify before signing</h1>
          <p className="mt-3 text-cream2">
            Mutual NDA access requires a verified profile before your request can be sent to the seller.
          </p>
          <Link
            className="btn-liquid mt-6 inline-flex px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
            href="/dashboard/buyer"
          >
            Return to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <NdaRequestForm
      listing={{
        ...listing,
        seller_id: "",
        deal_types: [],
        status: "live",
        is_anonymous: true,
        views_count: 0,
        dev_background: null,
        screenshots_urls: [],
        demo_video_url: null,
        tech_stack_detail: null,
        git_stats: {},
        dev_timeline: null,
        project_name: null,
        source_code_url: null,
        architecture_doc: null,
        revenue_data: {},
        roadmap: null,
        seller_name: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        listed_at: null,
        sold_at: null,
      }}
      buyerEmail={profile.email ?? user.email ?? ""}
      buyerName={profile.full_name ?? ""}
    />
  );
}
