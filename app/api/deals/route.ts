import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { logAction } from "@/lib/compliance/audit";
import { formatPence, maxDealPence } from "@/lib/deals/money";
import { checkVoyageManagerThreshold } from "@/lib/utils/voyage-manager";

const dealSchema = z.object({
  nda_request_id: z.string().uuid(),
  deal_type: z.enum(["acquire", "cofound", "merge"]),
  agreed_price_gbp: z.number().int().min(100),
});

/** A buyer with approved access opens a deal (their opening offer) on a listing. */
export async function POST(request: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;
  const { user, admin } = auth;

  const parsed = dealSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: ndaRequest } = await admin
    .from("nda_requests")
    .select("id, listing_id, seller_id")
    .eq("id", parsed.data.nda_request_id)
    .eq("buyer_id", user.id)
    .eq("status", "approved")
    .maybeSingle();

  if (!ndaRequest) {
    return NextResponse.json({ error: "Approved access is required before making an offer." }, { status: 403 });
  }

  const { data: listing } = await admin.from("listings").select("status").eq("id", ndaRequest.listing_id).single();

  if (listing?.status !== "live") {
    return NextResponse.json({ error: "This listing is no longer open to offers." }, { status: 409 });
  }

  if (parsed.data.deal_type === "acquire" && parsed.data.agreed_price_gbp > maxDealPence()) {
    return NextResponse.json(
      { error: `Purchases above ${formatPence(maxDealPence())} cannot be paid through the site yet.` },
      { status: 400 },
    );
  }

  const { data: deal, error } = await admin
    .from("deals")
    .insert({
      listing_id: ndaRequest.listing_id,
      buyer_id: user.id,
      seller_id: ndaRequest.seller_id,
      nda_request_id: ndaRequest.id,
      deal_type: parsed.data.deal_type,
      agreed_price_gbp: parsed.data.agreed_price_gbp,
      status: "negotiating",
    })
    .select("*")
    .single();

  if (error || !deal) {
    // 23505 = the one-open-deal-per-request unique index.
    const duplicate = error?.code === "23505";
    return NextResponse.json(
      { error: duplicate ? "You already have an open deal for this listing." : "Unable to create the deal." },
      { status: duplicate ? 409 : 500 },
    );
  }

  await checkVoyageManagerThreshold(deal);
  await logAction(user.id, "deal_created", "deal", deal.id, {
    listing_id: deal.listing_id,
    agreed_price_gbp: deal.agreed_price_gbp,
  });

  return NextResponse.json({ deal }, { status: 201 });
}
