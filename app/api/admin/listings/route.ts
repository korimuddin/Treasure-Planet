import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/compliance/admin";

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { data, error } = await auth.admin.from("listings").select("*").order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listings: data ?? [] });
}
