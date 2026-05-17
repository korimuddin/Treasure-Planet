import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: { dealId: string } };

const messageSchema = z.object({
  body: z.string().min(1),
});

async function getPartyDeal(supabase: ReturnType<typeof createClient>, dealId: string, userId: string) {
  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", dealId)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .single();

  return deal;
}

export async function GET(_request: Request, { params }: RouteContext) {
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

  const deal = await getPartyDeal(supabase, params.dealId, user.id);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("deal_id", params.dealId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: data ?? [] });
}

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

  const deal = await getPartyDeal(supabase, params.dealId, user.id);

  if (!deal) {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }

  const parsed = messageSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      deal_id: params.dealId,
      sender_id: user.id,
      body: parsed.data.body,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: data }, { status: 201 });
}
