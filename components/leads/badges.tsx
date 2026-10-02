import type { Lead, LeadSide } from "@/lib/supabase/database.types";
import { DEAD, statusLabel } from "@/lib/leads/status";

export function SideBadge({ side }: { side: LeadSide }) {
  return (
    <span className="rounded-[4px] border border-hairline-strong px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
      {side}
    </span>
  );
}

export function StatusBadge({ lead }: { lead: Pick<Lead, "status" | "dead_requested_at"> }) {
  const dead = lead.status === DEAD;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`rounded-[4px] border px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.08em] ${
          dead
            ? "border-overdue/40 text-overdue"
            : "border-hairline-strong text-accent"
        }`}
      >
        {statusLabel(lead.status)}
      </span>
      {lead.dead_requested_at && !dead && (
        <span className="rounded-[4px] border border-aging/40 px-1.5 py-px text-[10px] font-medium uppercase tracking-[0.08em] text-aging">
          Dead requested
        </span>
      )}
    </span>
  );
}

export function leadName(lead: Pick<Lead, "first_name" | "last_name">): string {
  return [lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed lead";
}
