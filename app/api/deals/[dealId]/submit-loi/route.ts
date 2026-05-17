import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { dealId: string } };

const loiSchema = z.object({
  deal_type: z.enum(["acquire", "cofound", "merge"]),
  agreed_price_gbp: z.number().int().min(1),
  proposed_closing_date: z.string().optional(),
  special_conditions: z.string().optional(),
});

export async function POST(request: Request, { params }: RouteContext) {
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
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  if (deal.status !== "negotiating" && deal.status !== "loi_sent") {
    return NextResponse.json({ error: "Only negotiating or LOI-sent deals can receive an LOI update." }, { status: 400 });
  }

  const parsed = loiSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("deals")
    .update({
      status: "loi_sent",
      loi_sent_at: new Date().toISOString(),
      deal_type: parsed.data.deal_type,
      agreed_price_gbp: parsed.data.agreed_price_gbp,
      loi_data: parsed.data,
      loi_counter: user.id === deal.seller_id ? deal.loi_counter + 1 : deal.loi_counter,
    })
    .eq("id", deal.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await logAction(user.id, user.id === deal.seller_id ? "loi_countered" : "loi_sent", "deal", deal.id, {
    loi_data: parsed.data,
  });

  return NextResponse.json({ deal: updated });
}
