/**
 * All money in this codebase is an integer number of PENCE, including the
 * database columns whose names end in `_gbp` (a known naming wart).
 */

function envInt(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

/** Platform fee in basis points. 1000 = 10%. */
export function platformFeeBps() {
  return envInt("PLATFORM_FEE_BPS", 1000);
}

export function platformFeePence(amountPence: number) {
  return Math.round((amountPence * platformFeeBps()) / 10000);
}

/** Largest deal the site will process. Default GBP 10,000 (Stripe's default Pay by Bank ceiling). */
export function maxDealPence() {
  return envInt("MAX_DEAL_GBP", 10000) * 100;
}

/** Cards are only offered at or below this amount, to cap chargeback exposure. Default GBP 500. */
export function cardCapPence() {
  return envInt("CARD_PAYMENT_CAP_GBP", 500) * 100;
}

export function formatPence(amountPence: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amountPence / 100);
}
