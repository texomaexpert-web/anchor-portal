import type { AgingLead } from "@/lib/data/dashboard";
import { daysAgo, overdueLabel, relativeDays } from "@/lib/time";
import { Card, EmptyLine } from "./card";

function nextStepLine(item: AgingLead): string {
  const task = item.overdueTask ?? item.nextTask;
  if (task) {
    return task.detail ? `${task.type} — ${task.detail}` : task.type;
  }
  const last = item.lead.last_contacted_at;
  return last
    ? `Reach out — last contact ${relativeDays(last)}`
    : "Reach out — never contacted";
}

// The signature anti-ghosting signal: how far gone is this lead?
// Fresh flags are still warm; the longer it sits, the colder it gets.
type Temperature = "warming" | "holding" | "cooling";

function temperature(item: AgingLead): Temperature {
  const d = daysAgo(item.overdueSince);
  if (d <= 1) return "warming";
  if (d <= 4) return "holding";
  return "cooling";
}

const tempStyles: Record<Temperature, { dot: string; text: string }> = {
  warming: { dot: "bg-accent", text: "text-accent" },
  holding: { dot: "bg-aging", text: "text-aging" },
  cooling: { dot: "bg-overdue", text: "text-overdue" },
};

export function AgingLeads({ items }: { items: AgingLead[] }) {
  return (
    <Card
      title="Needs attention"
      meta={items.length > 0 ? `${items.length} lead${items.length === 1 ? "" : "s"}` : undefined}
    >
      {items.length === 0 ? (
        <EmptyLine>All caught up. Nice.</EmptyLine>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((item) => {
            const temp = temperature(item);
            const badge = item.overdueTask?.due_at
              ? overdueLabel(item.overdueTask.due_at)
              : item.lead.last_contacted_at
                ? `${daysAgo(item.lead.last_contacted_at)}d since contact`
                : "never contacted";
            return (
              <li key={item.lead.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${tempStyles[temp].dot}`}
                      title={temp}
                    />
                    <span className="truncate text-sm font-medium text-ink">
                      {item.lead.first_name} {item.lead.last_name}
                      <span className="ml-2 text-xs font-normal capitalize text-ink-faint">
                        {item.lead.side} · {item.lead.status.replaceAll("_", " ")}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-[4px] border border-hairline bg-raised px-1.5 py-px font-mono text-[10px] tabular-nums ${
                      item.overdueTask ? "text-overdue" : "text-ink-muted"
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <p className="truncate pl-3.5 text-xs text-ink-muted">
                  <span className={`font-medium ${tempStyles[temp].text}`}>
                    Next:
                  </span>{" "}
                  {nextStepLine(item)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
