import type { TodayAppointment } from "@/lib/data/dashboard";
import { formatTime } from "@/lib/time";
import { Card, EmptyLine } from "./card";

export function TodayAppointments({
  items,
  showAgent,
}: {
  items: TodayAppointment[];
  showAgent: boolean;
}) {
  return (
    <Card title="Today's appointments">
      {items.length === 0 ? (
        <EmptyLine>Nothing on the calendar today.</EmptyLine>
      ) : (
        <ul className="divide-y divide-hairline">
          {items.map((appt) => (
            <li key={appt.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
              <span className="w-16 shrink-0 pt-0.5 font-mono text-xs font-medium tabular-nums text-accent">
                {formatTime(appt.starts_at)}
              </span>
              <div className="min-w-0 leading-snug">
                <div className="truncate text-sm font-medium text-ink">
                  {appt.lead
                    ? `${appt.lead.first_name} ${appt.lead.last_name}`
                    : "Unknown lead"}
                  <span className="ml-2 text-xs font-normal capitalize text-ink-faint">
                    {appt.type.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="truncate text-xs text-ink-muted">
                  {[appt.location, showAgent ? appt.agentName : null]
                    .filter(Boolean)
                    .join(" · ") || "No location set"}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
