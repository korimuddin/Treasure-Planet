import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditLog, Json } from "@/types/database";

export async function logAction(
  userId: string | null,
  action: string,
  entityType: AuditLog["entity_type"],
  entityId?: string | null,
  metadata: Json = {},
  ipAddress?: string | null,
) {
  try {
    const supabase = createAdminClient();
    await supabase.from("audit_log").insert({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      metadata,
      ip_address: ipAddress ?? null,
    });
  } catch {
    // Compliance logging should not break local preview flows when service credentials are absent.
  }
}
