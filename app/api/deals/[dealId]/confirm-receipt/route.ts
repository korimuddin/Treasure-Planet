import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { releaseDeal } from "@/lib/deals/settle";
import { sendEmail } from "@/lib/email/notifications";

export const runtime = "nodejs";

type RouteContext = { params: { dealId: string } };

/** Buyer confirms they received the project. This releases the held payment to the seller. */
export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const { data: deal } = await admin
    .from("deals")
    .select("id, seller_id")
    .eq("id", params.dealId)
    .eq("buyer_id", user.id)
    .maybeSingle();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  const result = await releaseDeal(admin, deal.id, ["ip_transferred"]);

  if (result.error !== undefined) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { data: seller } = await admin.from("profiles").select("email").eq("id", deal.seller_id).single();

  await sendEmail({
    to: seller?.email,
    subject: "Payment released",
    html: "<p>The buyer confirmed receipt and your payment has been released to your Stripe account.</p>",
  }).catch(() => undefined);

  await logAction(user.id, "deal_completed", "deal", deal.id, {
    transfer_id: result.deal.stripe_transfer_id,
    platform_fee_pence: result.deal.platform_fee_gbp,
  });

  return NextResponse.json({ deal: result.deal });
}
