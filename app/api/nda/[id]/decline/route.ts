import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { buyerDeclinedEmail, sendEmail } from "@/lib/email/notifications";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: {
    id: string;
  };
};

const declineSchema = z.object({
  decline_reason: z.string().optional(),
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

  const parsed = declineSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: ndaRequest } = await supabase
    .from("nda_requests")
    .select("*")
    .eq("id", params.id)
    .eq("seller_id", user.id)
    .single();

  if (!ndaRequest) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }

  if (ndaRequest.status !== "pending_review") {
    return NextResponse.json({ error: "Only pending review requests can be declined." }, { status: 400 });
  }

  const { data: updated, error } = await supabase
    .from("nda_requests")
    .update({
      status: "declined",
      seller_decided_at: new Date().toISOString(),
      decline_reason: parsed.data.decline_reason,
    })
    .eq("id", ndaRequest.id)
    .select("*")
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message ?? "Unable to decline request." }, { status: 500 });
  }

  const [{ data: buyer }, { data: listing }] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", updated.buyer_id).single(),
    supabase.from("listings").select("category_label, project_name").eq("id", updated.listing_id).single(),
  ]);

  await sendEmail({
    to: buyer?.email,
    subject: "Mutual NDA request update",
    html: buyerDeclinedEmail({
      buyerName: buyer?.full_name,
      listingTitle: listing?.project_name ?? listing?.category_label ?? "your listing",
      reason: updated.decline_reason,
    }),
  });

  await logAction(user.id, "nda_declined", "nda_request", updated.id, {
    listing_id: updated.listing_id,
    buyer_id: updated.buyer_id,
  });

  return NextResponse.json({ request: updated });
}
