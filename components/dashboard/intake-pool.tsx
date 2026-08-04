import type { Lead } from "@/lib/supabase/database.types";
import { relativeDays } from "@/lib/time";
import { Card, EmptyLine } from "./card";

// Broker only: leads with no agent yet, waiting for handoff.
export function IntakePool({ items }: { items: Lead[] }) {
  return (
    <Card
      title="Intake pool"
      meta={
        items.length > 0
          ? `${items.length} unassigned`
          : undefined
      }
    >
      {items.length === 0 ? (
        <EmptyLine>No unassigned leads. The pool is clear.</EmptyLine>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((lead) => (
            <li
              key={lead.id}
              className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 leading-snug">
                <div className="truncate text-[15px] font-medium text-ink">
                  {lead.first_name} {lead.last_name}
                  <span className="ml-2 text-xs font-normal capitalize text-ink-faint">
                    {lead.side}
                  </span>
                </div>
                <div className="truncate text-sm text-ink-muted">
                  {lead.source ?? "Unknown source"} · in{" "}
                  {relativeDays(lead.created_at) === "today"
                    ? "today"
                    : relativeDays(lead.created_at)}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium capitalize text-accent-deep">
                {lead.status.replaceAll("_", " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
