import type { DealStatus } from "@/types/database";

const stages = ["Listed", "NDA", "Review", "Data Room", "Offer", "Escrow", "Closed"];

const statusIndex: Record<DealStatus, number> = {
  negotiating: 0,
  loi_sent: 1,
  loi_accepted: 2,
  payment_pending: 3,
  in_escrow: 4,
  ip_transferred: 5,
  completed: 6,
  disputed: 5,
  cancelled: 0,
};

export function DealStageTracker({ status }: { status: string }) {
  const current = statusIndex[(status as DealStatus) ?? "negotiating"] ?? 0;

  return (
    <div className="relative grid grid-cols-7 items-start">
      <div className="absolute left-[7%] right-[7%] top-4 z-0 h-px bg-border" />
      {stages.map((stage, index) => {
        const done = index < current;
        const active = index === current;

        return (
          <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
            <span
              className={`grid h-8 w-8 place-items-center rounded-full border font-display text-xl ${
                done
                  ? "border-teal2 bg-teal-dim text-teal2"
                  : active
                    ? "border-gold bg-gold-dim text-gold"
                    : "border-border bg-ink2 text-muted"
              }`}
            >
              {done ? "✓" : active ? "→" : index + 1}
            </span>
            <span className="text-center font-mono text-[7.5px] uppercase tracking-[0.14em] text-muted">
              {stage}
            </span>
          </div>
        );
      })}
    </div>
  );
}
