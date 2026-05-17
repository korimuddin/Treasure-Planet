import { NextResponse } from "next/server";
import { logAction } from "@/lib/compliance/audit";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { dealId: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", params.dealId)
    .eq("seller_id", user.id)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  if (deal.status !== "in_escrow") {
    return NextResponse.json({ error: "Funds must be in escrow before transfer confirmation." }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("deals")
    .update({
      status: "ip_transferred",
      ip_transferred_at: new Date().toISOString(),
    })
    .eq("id", deal.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAction(user.id, "ip_transfer_confirmed", "deal", deal.id);

  return NextResponse.json({ deal: updated });
}
