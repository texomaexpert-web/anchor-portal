import Link from "next/link";
import type { PendingTask } from "@/lib/data/dashboard";
import { taskTypeLabel } from "@/lib/leads/tasks";
import { formatDate, overdueLabel } from "@/lib/time";
import { leadName } from "@/components/leads/badges";
import { EmptyLine } from "./card";

export function PendingTasks({ items }: { items: PendingTask[] }) {
  if (items.length === 0) {
    return <EmptyLine>No pending tasks. All caught up.</EmptyLine>;
  }
  const nowIso = new Date().toISOString();
  return (
    <ul className="divide-y divide-hairline">
      {items.map((task) => {
        const overdue = task.due_at !== null && task.due_at < nowIso;
        return (
          <li key={task.id} className="py-3 first:pt-0 last:pb-0">
            <Link href={`/leads/${task.lead_id}`} className="group flex items-center justify-between gap-3">
              <div className="min-w-0 leading-snug">
                <div className="truncate text-sm font-medium text-ink group-hover:text-accent">
                  {taskTypeLabel(task.type)}
                  <span className="font-normal text-ink-muted">
                    {" · "}
                    {task.lead ? leadName(task.lead) : "Unknown lead"}
                  </span>
                </div>
                {task.detail && (
                  <div className="truncate text-xs text-ink-muted">{task.detail}</div>
                )}
              </div>
              <span
                className={`shrink-0 rounded-[4px] border border-hairline bg-raised px-1.5 py-px font-mono text-[10px] tabular-nums ${
                  overdue ? "text-overdue" : "text-ink-muted"
                }`}
              >
                {task.due_at
                  ? overdue
                    ? overdueLabel(task.due_at)
                    : `due ${formatDate(task.due_at)}`
                  : "no date"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
