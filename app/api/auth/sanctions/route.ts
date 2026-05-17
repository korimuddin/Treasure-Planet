import { NextResponse } from "next/server";
import { z } from "zod";
import { screenUser } from "@/lib/compliance/sanctions";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  full_name: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ cleared: true, matches: [] });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  const result = await screenUser(user.id, parsed.success ? parsed.data.full_name : null, parsed.success ? parsed.data.country : null);

  return NextResponse.json(result);
}
