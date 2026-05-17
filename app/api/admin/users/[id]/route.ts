import { NextResponse } from "next/server";
import { z } from "zod";
import { logAction } from "@/lib/compliance/audit";
import { requireAdmin } from "@/lib/compliance/admin";

const schema = z.object({
  suspended: z.boolean().optional(),
  kyc_status: z.enum(["pending", "submitted", "verified", "failed"]).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const update = {
    ...(parsed.data.kyc_status ? { kyc_status: parsed.data.kyc_status } : {}),
    ...(typeof parsed.data.suspended === "boolean" ? { suspended_at: parsed.data.suspended ? new Date().toISOString() : null } : {}),
  };
  const { data, error } = await auth.admin.from("profiles").update(update).eq("id", params.id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logAction(auth.user.id, "admin_user_updated", "admin", params.id, parsed.data);
  return NextResponse.json({ user: data });
}
