import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  auto_approve: z.boolean().optional(),
  auto_approve_min_budget: z.number().int().min(0).optional(),
  auto_approve_deal_types: z.array(z.string()).optional(),
  response_message: z.string().optional(),
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

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (profile?.role !== "seller") {
    return NextResponse.json({ error: "Only sellers can update settings." }, { status: 403 });
  }

  const parsed = settingsSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("seller_settings")
    .upsert({
      seller_id: user.id,
      auto_approve: parsed.data.auto_approve ?? false,
      auto_approve_min_budget: parsed.data.auto_approve_min_budget ?? 0,
      auto_approve_deal_types: parsed.data.auto_approve_deal_types ?? [],
      response_message:
        parsed.data.response_message ?? "Thank you — you now have full data room access.",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ settings: data });
}
