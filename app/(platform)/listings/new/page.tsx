import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingCreateForm } from "@/components/listings/ListingCreateForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function NewListingPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/login");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, kyc_status, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "seller") {
    return (
      <main className="min-h-screen px-6 py-12">
        <section className="mx-auto max-w-2xl border border-border bg-[rgba(7,15,26,0.96)] p-8 backdrop-blur-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Seller access required</p>
          <h1 className="mt-4 font-display text-display-sm uppercase text-cream">Listings are for sellers</h1>
          <p className="mt-3 text-cream2">Create a seller profile before preparing a project listing.</p>
        </section>
      </main>
    );
  }

  if (profile.kyc_status !== "verified") {
    return (
      <main className="min-h-screen px-6 py-12">
        <section className="mx-auto max-w-2xl border border-border bg-[rgba(7,15,26,0.96)] p-8 backdrop-blur-3xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-gold">Verification required</p>
          <h1 className="mt-4 font-display text-display-sm uppercase text-cream">Verify before listing</h1>
          <p className="mt-3 text-cream2">
            Seller verification protects buyer confidence before a project can go live.
          </p>
          <Link
            href="/dashboard/seller"
            className="btn-liquid mt-6 inline-flex px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]"
          >
            Return to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return <ListingCreateForm sellerName={profile.full_name ?? user.email ?? ""} />;
}
