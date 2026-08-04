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

export function AgingLeads({ items }: { items: AgingLead[] }) {
  return (
    <Card
      title="Needs attention"
      meta={items.length > 0 ? `${items.length} lead${items.length === 1 ? "" : "s"}` : undefined}
    >
      {items.length === 0 ? (
        <EmptyLine>All caught up. Nice.</EmptyLine>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((item) => {
            const badge = item.overdueTask?.due_at
              ? overdueLabel(item.overdueTask.due_at)
              : item.lead.last_contacted_at
                ? `${daysAgo(item.lead.last_contacted_at)}d since contact`
                : "never contacted";
            return (
              <li key={item.lead.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-[15px] font-medium text-ink">
                    {item.lead.first_name} {item.lead.last_name}
                    <span className="ml-2 text-xs font-normal capitalize text-ink-faint">
                      {item.lead.side} · {item.lead.status.replaceAll("_", " ")}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.overdueTask
                        ? "bg-rust-soft text-rust"
                        : "bg-line/60 text-ink-muted"
                    }`}
                  >
                    {badge}
                  </span>
                </div>
                <p className="truncate text-sm text-ink-muted">
                  <span className="font-medium text-accent-deep">Next:</span>{" "}
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
