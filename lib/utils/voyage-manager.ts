import { sendEmail } from "@/lib/email/notifications";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Deal } from "@/types/database";

export async function checkVoyageManagerThreshold(deal: Pick<Deal, "id" | "agreed_price_gbp">) {
  const thresholdPence = Number(process.env.VOYAGE_MANAGER_THRESHOLD ?? 5000) * 100;

  if (deal.agreed_price_gbp < thresholdPence) {
    return;
  }

  try {
    const supabase = createAdminClient();
    await supabase
      .from("deals")
      .update({
        voyage_manager_assigned: false,
      })
      .eq("id", deal.id);
  } catch {
    // Local preview environments may not have service credentials yet.
  }

  await sendEmail({
    to: process.env.TREASURE_PLANET_ADMIN_EMAIL ?? process.env.RESEND_FROM_EMAIL,
    subject: "Voyage Manager review needed",
    html: `<p>Deal ${deal.id} meets the Voyage Manager threshold and needs manual assignment.</p>`,
  });
}
