"use client";

import { useState } from "react";
import type { DealType } from "@/types/database";

export function LOIForm({
  dealId,
  dealType,
  agreedPrice,
  onSubmitted,
}: {
  dealId: string;
  dealType: DealType;
  agreedPrice: number;
  onSubmitted?: () => void;
}) {
  const [type, setType] = useState<DealType>(dealType);
  const [price, setPrice] = useState(String(Math.round(agreedPrice / 100)));
  const [closingDate, setClosingDate] = useState("");
  const [conditions, setConditions] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function submit() {
    const response = await fetch(`/api/deals/${dealId}/submit-loi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deal_type: type,
        agreed_price_gbp: Math.round(Number(price) * 100),
        proposed_closing_date: closingDate,
        special_conditions: conditions,
      }),
    });

    if (response.ok) {
      setStatus("LOI sent to seller.");
      onSubmitted?.();
    } else {
      setStatus("Unable to send LOI.");
    }
  }

  return (
    <div className="space-y-4 border border-border bg-[rgba(7,15,26,0.72)] p-4">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-gold">Letter of Intent</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Deal type</span>
          <select className="auth-input" value={type} onChange={(event) => setType(event.target.value as DealType)}>
            <option value="acquire">Acquire</option>
            <option value="cofound">Cofound</option>
            <option value="merge">Merge</option>
          </select>
        </label>
        <label>
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Agreed price
          </span>
          <input className="auth-input" type="number" value={price} onChange={(event) => setPrice(event.target.value)} />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Proposed closing date
          </span>
          <input
            className="auth-input"
            type="date"
            value={closingDate}
            onChange={(event) => setClosingDate(event.target.value)}
          />
        </label>
        <label className="sm:col-span-2">
          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Special conditions
          </span>
          <textarea className="auth-input min-h-24" value={conditions} onChange={(event) => setConditions(event.target.value)} />
        </label>
      </div>
      {status && <p className="font-mono text-xs uppercase tracking-[0.14em] text-teal2">{status}</p>}
      <button className="btn-liquid px-5 py-3 font-mono text-xs uppercase tracking-[0.16em]" type="button" onClick={submit}>
        Send LOI
      </button>
    </div>
  );
}
