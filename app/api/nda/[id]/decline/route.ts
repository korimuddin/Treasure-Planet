import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { buyerDeclinedEmail, sendEmail } from "@/lib/email/notifications";
import { listingDisplayTitle } from "@/lib/listings/access";

type RouteContext = { params: { id: string } };

const declineSchema = z.object({
  decline_reason: z.string().max(1000).optional(),
});

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const parsed = declineSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: updated } = await admin
    .from("nda_requests")
    .update({
      status: "declined",
      seller_decided_at: new Date().toISOString(),
      decline_reason: parsed.data.decline_reason,
    })
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .eq("status", "pending_review")
    .select("*")
    .maybeSingle();

  if (!updated) {
    return NextResponse.json({ error: "No request awaiting your review was found." }, { status: 404 });
  }

  const [{ data: buyer }, { data: listing }] = await Promise.all([
    admin.from("profiles").select("full_name, email").eq("id", updated.buyer_id).single(),
    admin
      .from("listings")
      .select("category_label, project_name, is_anonymous")
      .eq("id", updated.listing_id)
      .single(),
  ]);

  // A declined buyer must never learn an anonymous project's real name.
  await sendEmail({
    to: buyer?.email,
    subject: "Access request update",
    html: buyerDeclinedEmail({
      buyerName: buyer?.full_name,
      listingTitle: listing ? listingDisplayTitle(listing) : "the listing",
      reason: updated.decline_reason,
    }),
  }).catch(() => undefined);

  await logAction(user.id, "nda_declined", "nda_request", updated.id, {
    listing_id: updated.listing_id,
    buyer_id: updated.buyer_id,
  });

  return NextResponse.json({ request: updated });
}
