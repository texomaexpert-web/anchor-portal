import Link from "next/link";
import type { Lead } from "@/lib/supabase/database.types";
import { relativeDays } from "@/lib/time";
import { SideBadge, StatusBadge, leadName } from "@/components/leads/badges";
import { EmptyLine } from "./card";

export function NewLeads({
  items,
  agentNameById,
}: {
  items: Lead[];
  agentNameById?: Map<string, string>;
}) {
  if (items.length === 0) {
    return <EmptyLine>No new leads since your last login.</EmptyLine>;
  }
  return (
    <ul className="divide-y divide-hairline">
      {items.map((lead) => (
        <li key={lead.id} className="py-3 first:pt-0 last:pb-0">
          <Link href={`/leads/${lead.id}`} className="group flex items-center justify-between gap-3">
            <div className="min-w-0 leading-snug">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-ink group-hover:text-accent">
                  {leadName(lead)}
                </span>
                <SideBadge side={lead.side} />
              </div>
              <div className="truncate text-xs text-ink-muted">
                {lead.source ?? "Unknown source"} · in {relativeDays(lead.created_at)}
                {agentNameById &&
                  ` · ${lead.agent_id ? (agentNameById.get(lead.agent_id) ?? "—") : "Unassigned"}`}
              </div>
            </div>
            <StatusBadge lead={lead} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
