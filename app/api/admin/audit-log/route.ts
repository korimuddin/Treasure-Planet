import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/compliance/admin";
import type { AuditLog } from "@/types/database";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const params = request.nextUrl.searchParams;
  let query = auth.admin.from("audit_log").select("*").order("created_at", { ascending: false }).limit(200);
  const user = params.get("user");
  const action = params.get("action");
  const entity = params.get("entity_type");
  const from = params.get("from");
  const to = params.get("to");
  if (user) query = query.eq("user_id", user);
  if (action) query = query.ilike("action", `%${action}%`);
  if (entity) query = query.eq("entity_type", entity as AuditLog["entity_type"]);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ auditLog: data ?? [] });
}
