import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { formatPence, maxDealPence } from "@/lib/deals/money";

type RouteContext = { params: { dealId: string } };

const loiSchema = z.object({
  deal_type: z.enum(["acquire", "cofound", "merge"]),
  agreed_price_gbp: z.number().int().min(100),
  proposed_closing_date: z.string().max(40).optional(),
  special_conditions: z.string().max(4000).optional(),
});

/** Either party proposes (or counters with) terms. Only the OTHER party can accept them. */
export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const parsed = loiSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.deal_type === "acquire" && parsed.data.agreed_price_gbp > maxDealPence()) {
    return NextResponse.json(
      { error: `Purchases above ${formatPence(maxDealPence())} cannot be paid through the site yet.` },
      { status: 400 },
    );
  }

  const { data: deal } = await admin.from("deals").select("*").eq("id", params.dealId).maybeSingle();

  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  const isSeller = user.id === deal.seller_id;
  const { data: updated } = await admin
    .from("deals")
    .update({
      status: "loi_sent",
      loi_sent_at: new Date().toISOString(),
      deal_type: parsed.data.deal_type,
      agreed_price_gbp: parsed.data.agreed_price_gbp,
      loi_data: { ...parsed.data, submitted_by: user.id },
      loi_counter: isSeller ? deal.loi_counter + 1 : deal.loi_counter,
    })
    .eq("id", deal.id)
    .in("status", ["negotiating", "loi_sent"])
    .select("*")
    .maybeSingle();

  if (!updated) {
    return NextResponse.json({ error: "Terms can no longer be changed on this deal." }, { status: 409 });
  }

  await logAction(user.id, isSeller ? "loi_countered" : "loi_sent", "deal", deal.id, {
    loi_data: parsed.data,
  });

  return NextResponse.json({ deal: updated });
}
