import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { sendEmail } from "@/lib/email/notifications";

type RouteContext = { params: { dealId: string } };

/** Seller states they have handed the project over. Only possible once the buyer's payment is held. */
export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const { data: updated } = await admin
    .from("deals")
    .update({ status: "ip_transferred", ip_transferred_at: new Date().toISOString() })
    .eq("id", params.dealId)
    .eq("seller_id", user.id)
    .eq("status", "in_escrow")
    .not("stripe_payment_intent_id", "is", null)
    .select("*")
    .maybeSingle();

  if (!updated) {
    return NextResponse.json(
      { error: "The buyer's payment must be confirmed before you mark the project as transferred." },
      { status: 409 },
    );
  }

  const { data: buyer } = await admin.from("profiles").select("email").eq("id", updated.buyer_id).single();

  await sendEmail({
    to: buyer?.email,
    subject: "The seller has transferred the project",
    html: "<p>The seller has marked the project as transferred. Check what you received, then confirm receipt from your dashboard to release the payment, or raise a problem if something is missing.</p>",
  }).catch(() => undefined);

  await logAction(user.id, "ip_transfer_confirmed", "deal", updated.id);

  return NextResponse.json({ deal: updated });
}
