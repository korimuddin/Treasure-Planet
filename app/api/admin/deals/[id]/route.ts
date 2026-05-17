import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { requireAdmin } from "@/lib/compliance/admin";

const schema = z.object({ voyage_manager_name: z.string().optional(), voyage_manager_email: z.string().email().optional(), flag: z.boolean().optional() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.flag) {
    await auth.admin.from("sar_flags").insert({ entity_type: "deal", entity_id: params.id, flag_reason: "Admin flagged deal for review", severity: "medium" });
  }
  const { data, error } = await auth.admin
    .from("deals")
    .update({
      voyage_manager_assigned: Boolean(parsed.data.voyage_manager_name || parsed.data.voyage_manager_email),
      voyage_manager_name: parsed.data.voyage_manager_name,
      voyage_manager_email: parsed.data.voyage_manager_email,
    })
    .eq("id", params.id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAction(auth.user.id, "admin_deal_updated", "admin", params.id, parsed.data);
  return NextResponse.json({ deal: data });
}
