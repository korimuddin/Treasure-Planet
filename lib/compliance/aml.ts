import { createAdminClient } from "@/lib/supabase/admin";
import type { Deal } from "@/types/database";

export async function checkTransactionForAML(deal: Pick<Deal, "id" | "buyer_id" | "agreed_price_gbp">) {
  const flags: string[] = [];

  try {
    const supabase = createAdminClient();
    const { data: completedDeals } = await supabase
      .from("deals")
      .select("agreed_price_gbp")
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(20);

    const prices = completedDeals?.map((item) => item.agreed_price_gbp).filter(Boolean) ?? [];
    const average = prices.length ? prices.reduce((sum, price) => sum + price, 0) / prices.length : 0;

    if (average > 0 && deal.agreed_price_gbp > average * 3) {
      flags.push("Deal price is more than three times the recent completed-deal average.");
    }

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { count } = await supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("buyer_id", deal.buyer_id)
      .gte("created_at", since.toISOString());

    if ((count ?? 0) > 5) {
      flags.push("Buyer velocity exceeds five deals in thirty days.");
    }

    if (flags.length) {
      await supabase.from("sar_flags").insert(
        flags.map((flag) => ({
          entity_type: "deal",
          entity_id: deal.id,
          flag_reason: flag,
          severity: flag.includes("three times") ? "high" : "medium",
        })),
      );
    }
  } catch {
    return { flagged: false, flags: [] };
  }

  return { flagged: flags.length > 0, flags };
}
