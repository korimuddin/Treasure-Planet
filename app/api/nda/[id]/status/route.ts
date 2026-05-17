import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_request: Request, { params }: RouteContext) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ status: null, request: null });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: null, request: null });
  }

  const { data: ndaRequest } = await supabase
    .from("nda_requests")
    .select("*")
    .eq("listing_id", params.id)
    .eq("buyer_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    status: ndaRequest?.status ?? null,
    request: ndaRequest ?? null,
  });
}
