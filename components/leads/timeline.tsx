import type { LeadDetail } from "@/lib/data/leads";
import type { Activity } from "@/lib/supabase/database.types";
import { statusLabel } from "@/lib/leads/status";
import {
  CONTACT_METHOD_LABELS,
  CONTACT_OUTCOME_LABELS,
  taskTypeLabel,
} from "@/lib/leads/tasks";
import { formatDate, formatDateTime } from "@/lib/time";

type Kind = "lead" | "status" | "contact" | "note" | "task" | "message" | "web" | "appointment";

type Item = {
  key: string;
  at: string;
  kind: Kind;
  title: string;
  body?: string | null;
  actor?: string | null;
};

const kindDot: Record<Kind, string> = {
  lead: "bg-accent",
  status: "bg-accent",
  contact: "bg-ink",
  note: "bg-ink-muted",
  task: "bg-aging",
  message: "bg-ink-muted",
  web: "bg-ink-faint",
  appointment: "bg-accent",
};

// Every activity reference names the action (Phase Two: "viewed Kingston
// listing", not "active 3 days ago").
function webTitle(a: Activity): string {
  const where = a.listing_address ?? a.listing_id;
  switch (a.event_type) {
    case "listing_view":
      return where ? `Viewed listing: ${where}` : "Viewed a listing";
    case "saved_listing":
      return where ? `Saved listing: ${where}` : "Saved a listing";
    case "search":
      return "Ran a search";
    case "site_visit":
      return "Visited the website";
    case "form_submit":
      return "Submitted a form on the website";
  }
}

export function buildTimeline(
  detail: LeadDetail,
  nameOf: (agentId: string | null) => string | null,
): Item[] {
  const { lead } = detail;
  const items: Item[] = [
    { key: `lead-${lead.id}`, at: lead.created_at, kind: "lead", title: `Lead added${lead.source ? ` from ${lead.source}` : ""}` },
  ];

  for (const s of detail.statusHistory) {
    if (s.from_status === null) continue; // the "Lead added" row covers it
    items.push({
      key: `status-${s.id}`,
      at: s.changed_at,
      kind: "status",
      title: `Status: ${statusLabel(s.from_status)} → ${statusLabel(s.to_status)}`,
      actor: nameOf(s.agent_id) ?? s.changed_by,
    });
  }
  for (const c of detail.contacts) {
    items.push({
      key: `contact-${c.id}`,
      at: c.contacted_at,
      kind: "contact",
      title: `${CONTACT_METHOD_LABELS[c.method]} — ${CONTACT_OUTCOME_LABELS[c.outcome]}`,
      body: c.body,
      actor: nameOf(c.agent_id),
    });
  }
  for (const n of detail.notes) {
    items.push({ key: `note-${n.id}`, at: n.created_at, kind: "note", title: "Note", body: n.body, actor: nameOf(n.agent_id) });
  }
  for (const t of detail.tasks) {
    const label = taskTypeLabel(t.type);
    items.push({
      key: `task-${t.id}`,
      at: t.created_at,
      kind: "task",
      title: `Task scheduled: ${label}${t.due_at ? ` (due ${formatDate(t.due_at)})` : ""}`,
      body: t.detail,
      actor: nameOf(t.agent_id) ?? t.created_by,
    });
    if (t.completed_at) {
      items.push({ key: `task-done-${t.id}`, at: t.completed_at, kind: "task", title: `Task done: ${label}`, actor: nameOf(t.agent_id) });
    }
  }
  for (const m of detail.messages) {
    const channel = m.channel === "sms" ? "text" : "email";
    items.push({
      key: `msg-${m.id}`,
      at: m.sent_at,
      kind: "message",
      title:
        m.direction === "inbound"
          ? `Lead replied by ${channel}`
          : `${m.sent_by === "anchor" ? "Anchor" : (nameOf(m.agent_id) ?? "Agent")} sent a ${channel}`,
      body: m.body,
    });
  }
  for (const a of detail.activity) {
    items.push({ key: `web-${a.id}`, at: a.occurred_at, kind: "web", title: webTitle(a) });
  }
  for (const a of detail.appointments) {
    items.push({
      key: `appt-${a.id}`,
      at: a.created_at,
      kind: "appointment",
      title: `Appointment set: ${a.type.replaceAll("_", " ")} on ${formatDateTime(a.starts_at)}`,
      body: a.location,
      actor: nameOf(a.agent_id),
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at));
}

export function Timeline({ items }: { items: Item[] }) {
  return (
    <ol className="flex flex-col">
      {items.map((item) => (
        <li key={item.key} className="relative flex gap-3 pb-4 last:pb-0">
          <span className="relative flex w-2 shrink-0 justify-center pt-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${kindDot[item.kind]}`} />
          </span>
          <div className="min-w-0 flex-1 leading-snug">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-sm text-ink">{item.title}</span>
              <span className="font-mono text-[10px] tabular-nums text-ink-faint">
                {formatDateTime(item.at)}
              </span>
            </div>
            {item.actor && (
              <div className="text-xs capitalize text-ink-faint">{item.actor}</div>
            )}
            {item.body && (
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{item.body}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
