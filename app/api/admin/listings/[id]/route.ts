import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { requireAdmin } from "@/lib/compliance/admin";

const schema = z.object({ status: z.enum(["draft", "live", "under_offer", "sold", "withdrawn"]).optional(), flag: z.boolean().optional() });

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  if (parsed.data.flag) {
    await auth.admin.from("sar_flags").insert({ entity_type: "listing", entity_id: params.id, flag_reason: "Admin flagged listing for review", severity: "medium" });
  }
  const { data, error } = await auth.admin.from("listings").update(parsed.data.status ? { status: parsed.data.status } : {}).eq("id", params.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAction(auth.user.id, "admin_listing_updated", "admin", params.id, parsed.data);
  return NextResponse.json({ listing: data });
}
