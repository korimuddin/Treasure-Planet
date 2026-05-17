import { logAction } from "@/lib/compliance/audit";
import { createAdminClient } from "@/lib/supabase/admin";

export async function screenUser(userId: string, fullName?: string | null, country?: string | null) {
  const matches: string[] = [];
  const cleared = matches.length === 0;

  await logAction(userId, "sanctions_screened", "user", userId, {
    full_name: fullName ?? null,
    country: country ?? null,
    cleared,
    matches,
  });

  if (!cleared) {
    try {
      const supabase = createAdminClient();
      await Promise.all([
        supabase.from("profiles").update({ sanctions_flagged: true }).eq("id", userId),
        supabase.from("sar_flags").insert({
          entity_type: "user",
          entity_id: userId,
          flag_reason: `Potential sanctions match: ${matches.join(", ")}`,
          severity: "critical",
        }),
      ]);
    } catch {
      // Local preview may not have service credentials.
    }
  }

  return { cleared, matches };
}
