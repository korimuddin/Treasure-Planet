import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { requireAdmin } from "@/lib/compliance/admin";

const schema = z.object({ reviewed: z.boolean().optional(), notes: z.string().optional(), severity: z.enum(["low", "medium", "high", "critical"]).optional() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { data, error } = await auth.admin
    .from("sar_flags")
    .update({
      ...parsed.data,
      reviewed_by: parsed.data.reviewed ? auth.user.id : undefined,
      reviewed_at: parsed.data.reviewed ? new Date().toISOString() : undefined,
    })
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAction(auth.user.id, "admin_sar_flag_updated", "admin", params.id, parsed.data);
  return NextResponse.json({ flag: data });
}
