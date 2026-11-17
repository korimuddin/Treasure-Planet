import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { buyerApprovedEmail, sendEmail } from "@/lib/email/notifications";

type RouteContext = { params: { id: string } };

export async function POST(_request: Request, { params }: RouteContext) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  // The status guard in the update makes a double-click or race a no-op.
  const { data: updated } = await admin
    .from("nda_requests")
    .update({ status: "approved", seller_decided_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .eq("status", "pending_review")
    .select("*")
    .maybeSingle();

  if (!updated) {
    return NextResponse.json({ error: "No request awaiting your review was found." }, { status: 404 });
  }

  await admin.from("listing_nda_access").upsert({
    listing_id: updated.listing_id,
    user_id: updated.buyer_id,
    status: "approved",
  });

  const [{ data: buyer }, { data: listing }, { data: settings }] = await Promise.all([
    admin.from("profiles").select("full_name, email").eq("id", updated.buyer_id).single(),
    admin.from("listings").select("category_label, project_name").eq("id", updated.listing_id).single(),
    admin.from("seller_settings").select("response_message").eq("seller_id", user.id).maybeSingle(),
  ]);

  await sendEmail({
    to: buyer?.email,
    subject: "Access request approved",
    html: buyerApprovedEmail({
      buyerName: buyer?.full_name,
      listingTitle: listing?.project_name ?? listing?.category_label ?? "the listing",
      message: settings?.response_message,
    }),
  }).catch(() => undefined);

  await logAction(user.id, "nda_approved", "nda_request", updated.id, {
    listing_id: updated.listing_id,
    buyer_id: updated.buyer_id,
  });

  return NextResponse.json({ request: updated });
}
