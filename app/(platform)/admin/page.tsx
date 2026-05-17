import { redirect } from "next/navigation";
import { AdminPanelClient } from "@/components/admin/AdminPanelClient";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect("/marketplace");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/marketplace");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/marketplace");

  const admin = createAdminClient();
  const [listings, users, deals, flags, auditLog] = await Promise.all([
    admin.from("listings").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("profiles").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("deals").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("sar_flags").select("*").order("created_at", { ascending: false }).limit(100),
    admin.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <AdminPanelClient
      listings={listings.data ?? []}
      users={users.data ?? []}
      deals={deals.data ?? []}
      flags={flags.data ?? []}
      auditLog={auditLog.data ?? []}
    />
  );
}
