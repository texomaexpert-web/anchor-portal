import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionAgent } from "@/lib/auth";
import { getLeadDetail, listStaff } from "@/lib/data/leads";
import { completeTask } from "@/app/(portal)/leads/actions";
import { lastHeardFrom, suggestNextTask } from "@/lib/leads/next-task";
import { taskTypeLabel } from "@/lib/leads/tasks";
import { formatDate, formatDateTime, overdueLabel } from "@/lib/time";
import { Card, EmptyLine } from "@/components/dashboard/card";
import { SideBadge, StatusBadge, leadName } from "@/components/leads/badges";
import { StatusControl } from "@/components/leads/status-control";
import { AssignControl } from "@/components/leads/assign-control";
import { LogContact } from "@/components/leads/log-contact";
import { TaskForm } from "@/components/leads/task-form";
import { NoteForm } from "@/components/leads/note-form";
import { Timeline, buildTimeline } from "@/components/leads/timeline";
import { SubmitButton } from "@/components/ui/form";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: PageProps<"/leads/[id]">) {
  const { id } = await props.params;
  const detail = await getLeadDetail(id);
  return { title: detail ? leadName(detail.lead) : "Lead" };
}

export default async function LeadPage(props: PageProps<"/leads/[id]">) {
  const { id } = await props.params;
  const { agent } = await getSessionAgent();
  if (!agent) return null;
  const isBroker = agent.role === "broker";

  // RLS hides other agents' leads — to an agent they simply don't exist.
  const [detail, staff] = await Promise.all([getLeadDetail(id), listStaff()]);
  if (!detail) notFound();

  const { lead, tasks, notes, contacts, messages } = detail;
  const nameById = new Map(staff.map((s) => [s.id, s.name]));
  const nameOf = (agentId: string | null) => (agentId ? (nameById.get(agentId) ?? null) : null);

  const openTasks = tasks.filter((t) => !t.completed_at);
  const doneTasks = tasks
    .filter((t) => t.completed_at)
    .sort((a, b) => b.completed_at!.localeCompare(a.completed_at!));

  const nowIso = new Date().toISOString();
  const suggestion = suggestNextTask(
    lastHeardFrom(lead.created_at, [
      lead.last_activity_at,
      contacts.find((c) => c.outcome === "reached")?.contacted_at,
      messages.find((m) => m.direction === "inbound")?.sent_at,
    ]),
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/leads" className="text-xs text-ink-faint hover:text-ink-muted">
        ← Leads
      </Link>

      <header className="mb-8 mt-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-ink">{leadName(lead)}</h1>
          <SideBadge side={lead.side} />
          <StatusBadge lead={lead} />
        </div>
        <p className="mt-1.5 text-sm text-ink-muted">
          {lead.source ?? "Unknown source"} · added{" "}
          <span className="font-mono tabular-nums">{formatDate(lead.created_at)}</span>
          {" · "}
          {lead.agent_id ? (
            nameOf(lead.agent_id)
          ) : (
            <span className="text-aging">Unassigned</span>
          )}
          {lead.last_contacted_at && (
            <>
              {" · last contact "}
              <span className="font-mono tabular-nums">{formatDateTime(lead.last_contacted_at)}</span>
            </>
          )}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="flex flex-col gap-5 lg:col-span-3">
          <Card title="Log a contact">
            <LogContact leadId={lead.id} />
          </Card>

          <Card
            title="Tasks"
            meta={openTasks.length > 0 ? `${openTasks.length} open` : undefined}
          >
            {openTasks.length === 0 ? (
              <EmptyLine>No open tasks. Every lead should have a next step.</EmptyLine>
            ) : (
              <ul className="divide-y divide-hairline">
                {openTasks.map((task) => {
                  const overdue = task.due_at !== null && task.due_at < nowIso;
                  return (
                    <li key={task.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                      <div className="min-w-0 leading-snug">
                        <div className="text-sm font-medium text-ink">
                          {taskTypeLabel(task.type)}
                          {task.detail && (
                            <span className="font-normal text-ink-muted"> — {task.detail}</span>
                          )}
                        </div>
                        <div
                          className={`font-mono text-[10px] tabular-nums ${overdue ? "text-overdue" : "text-ink-faint"}`}
                        >
                          {task.due_at
                            ? overdue
                              ? `${overdueLabel(task.due_at)} · due ${formatDate(task.due_at)}`
                              : `due ${formatDate(task.due_at)}`
                            : "no due date"}
                          {nameOf(task.agent_id) && ` · ${nameOf(task.agent_id)}`}
                        </div>
                      </div>
                      <form action={completeTask}>
                        <input type="hidden" name="task_id" value={task.id} />
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <SubmitButton variant="quiet" pendingLabel="…">
                          Done
                        </SubmitButton>
                      </form>
                    </li>
                  );
                })}
              </ul>
            )}
            <details className="mt-3 border-t border-hairline pt-3">
              <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">
                Add a task
              </summary>
              <div className="mt-3">
                <TaskForm leadId={lead.id} defaultDueDate={suggestion.dueDate} />
              </div>
            </details>
            {doneTasks.length > 0 && (
              <details className="mt-3 border-t border-hairline pt-3">
                <summary className="cursor-pointer text-sm text-ink-faint hover:text-ink-muted">
                  {doneTasks.length} completed
                </summary>
                <ul className="mt-2 flex flex-col gap-1">
                  {doneTasks.map((t) => (
                    <li key={t.id} className="text-sm text-ink-faint line-through">
                      {taskTypeLabel(t.type)}
                      {t.detail ? ` — ${t.detail}` : ""}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </Card>

          <Card title="Notes" meta={notes.length > 0 ? `${notes.length}` : undefined}>
            <NoteForm leadId={lead.id} />
            {notes.length > 0 && (
              <ul className="mt-4 divide-y divide-hairline border-t border-hairline">
                {notes.map((n) => (
                  <li key={n.id} className="py-3 last:pb-0">
                    <p className="whitespace-pre-wrap text-sm text-ink">{n.body}</p>
                    <p className="mt-1 font-mono text-[10px] tabular-nums text-ink-faint">
                      {formatDateTime(n.created_at)}
                      {nameOf(n.agent_id) && ` · ${nameOf(n.agent_id)}`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Activity history">
            <Timeline items={buildTimeline(detail, nameOf)} />
          </Card>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2">
          <Card title="Contact">
            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Phone</dt>
                <dd className="font-mono tabular-nums text-ink">
                  {lead.phone ? <a href={`tel:${lead.phone}`} className="hover:text-accent">{lead.phone}</a> : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Email</dt>
                <dd className="truncate text-ink">
                  {lead.email ? <a href={`mailto:${lead.email}`} className="hover:text-accent">{lead.email}</a> : "—"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Source</dt>
                <dd className="text-ink">{lead.source ?? "—"}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Status">
            <StatusControl
              lead={lead}
              isBroker={isBroker}
              requestedByName={nameOf(lead.dead_requested_by)}
            />
          </Card>

          <Card title="Assigned agent">
            {isBroker ? (
              <AssignControl leadId={lead.id} agentId={lead.agent_id} staff={staff} />
            ) : (
              <p className="text-sm text-ink">{nameOf(lead.agent_id) ?? "—"}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
