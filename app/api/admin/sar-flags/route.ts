import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/compliance/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { data, error } = await auth.admin.from("sar_flags").select("*").order("severity", { ascending: true }).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const weight = { critical: 0, high: 1, medium: 2, low: 3 };
  return NextResponse.json({ flags: (data ?? []).sort((a, b) => weight[a.severity] - weight[b.severity]) });
}
