import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { escapeHtml, sendEmail } from "@/lib/email/notifications";

type RouteContext = { params: { dealId: string } };

const schema = z.object({ reason: z.string().trim().min(10).max(2000) });

/**
 * Either party flags a problem while the payment is held. The deal freezes
 * (no release, no refund) until an admin decides from the admin panel.
 */
export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const parsed = schema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Describe the problem in at least a sentence." }, { status: 400 });
  }

  const { data: deal } = await admin.from("deals").select("id, buyer_id, seller_id").eq("id", params.dealId).maybeSingle();

  if (!deal || (deal.buyer_id !== user.id && deal.seller_id !== user.id)) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  const { data: updated } = await admin
    .from("deals")
    .update({ status: "disputed", disputed_at: new Date().toISOString(), dispute_reason: parsed.data.reason })
    .eq("id", deal.id)
    .in("status", ["in_escrow", "ip_transferred"])
    .select("*")
    .maybeSingle();

  if (!updated) {
    return NextResponse.json({ error: "A problem can only be raised while a payment is held." }, { status: 409 });
  }

  await sendEmail({
    to: process.env.TREASURE_PLANET_ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL,
    subject: "Deal dispute raised",
    html: `<p>Deal ${escapeHtml(deal.id)} was disputed by the ${user.id === deal.buyer_id ? "buyer" : "seller"}.</p><p>${escapeHtml(parsed.data.reason)}</p><p>Release or refund it from the admin panel.</p>`,
  }).catch(() => undefined);

  await logAction(user.id, "deal_disputed", "deal", deal.id, { reason: parsed.data.reason });

  return NextResponse.json({ deal: updated });
}
