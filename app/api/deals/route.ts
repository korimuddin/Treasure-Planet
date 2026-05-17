import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { createClient } from "@/lib/supabase/server";
import { checkVoyageManagerThreshold } from "@/lib/utils/voyage-manager";

const dealSchema = z.object({
  listing_id: z.string().uuid(),
  nda_request_id: z.string().uuid(),
  deal_type: z.enum(["acquire", "cofound", "merge"]),
  agreed_price_gbp: z.number().int().min(1),
});

export async function POST(request: Request) {
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

  const parsed = dealSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data: ndaRequest } = await supabase
    .from("nda_requests")
    .select("*")
    .eq("id", parsed.data.nda_request_id)
    .eq("listing_id", parsed.data.listing_id)
    .eq("buyer_id", user.id)
    .eq("status", "approved")
    .single();

  if (!ndaRequest) {
    return NextResponse.json({ error: "Approved mutual NDA access is required before making an offer." }, { status: 403 });
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      listing_id: parsed.data.listing_id,
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
    return NextResponse.json({ error: error?.message ?? "Unable to create deal." }, { status: 500 });
  }

  await checkVoyageManagerThreshold(deal);
  await logAction(user.id, "deal_created", "deal", deal.id, {
    listing_id: deal.listing_id,
    agreed_price_gbp: deal.agreed_price_gbp,
  });

  return NextResponse.json({ deal }, { status: 201 });
}
