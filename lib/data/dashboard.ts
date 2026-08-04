import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Agent, Appointment, Lead, Task } from "@/lib/supabase/database.types";
import { todayBounds } from "@/lib/time";

// A lead goes "aging" when it hasn't been contacted in this many days.
const STALE_CONTACT_DAYS = 3;

export type AgingLead = {
  lead: Lead;
  // Why it's on the list.
  staleContact: boolean;
  overdueTask: Task | null;
  // The single most urgent open task — the next best step.
  nextTask: Task | null;
  // Timestamp the lead started needing attention; earliest sorts first.
  overdueSince: string;
};

export type TodayAppointment = Appointment & {
  lead: Lead | null;
  agentName: string | null;
};

export type DashboardData = {
  agingLeads: AgingLead[];
  todayAppointments: TodayAppointment[];
  // Broker only: unassigned leads waiting in the intake pool, oldest first.
  intakePool: Lead[];
  openTaskCount: number;
};

// All reads use the service-role client on the server: RLS is enabled on
// every table but has no policies yet, so the anon key can't read anything.
// Role-based scoping happens here in query filters instead.
// TODO: per-agent RLS policies — then this moves to the session client.
export async function getDashboardData(agent: Agent): Promise<DashboardData> {
  const db = createAdminClient();
  const isBroker = agent.role === "broker";
  const now = new Date();
  const { start, end } = todayBounds(now);

  const leadsQuery = isBroker
    ? db.from("lead").select("*")
    : db.from("lead").select("*").eq("agent_id", agent.id);

  const tasksQuery = isBroker
    ? db.from("task").select("*").is("completed_at", null)
    : db.from("task").select("*").is("completed_at", null).eq("agent_id", agent.id);

  const appointmentsQuery = (
    isBroker
      ? db.from("appointment").select("*")
      : db.from("appointment").select("*").eq("agent_id", agent.id)
  )
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  const [leadsRes, tasksRes, appointmentsRes] = await Promise.all([
    leadsQuery,
    tasksQuery,
    appointmentsQuery,
  ]);

  const firstError = leadsRes.error ?? tasksRes.error ?? appointmentsRes.error;
  if (firstError) {
    throw new Error(`Dashboard query failed: ${firstError.message}`);
  }

  const leads = leadsRes.data ?? [];
  const openTasks = tasksRes.data ?? [];
  const appointments = appointmentsRes.data ?? [];

  const leadById = new Map(leads.map((l) => [l.id, l]));

  const openTasksByLead = new Map<string, Task[]>();
  for (const task of openTasks) {
    const list = openTasksByLead.get(task.lead_id) ?? [];
    list.push(task);
    openTasksByLead.set(task.lead_id, list);
  }
  // Earliest due first; tasks with no due date last.
  for (const list of openTasksByLead.values()) {
    list.sort((a, b) => {
      if (!a.due_at) return b.due_at ? 1 : 0;
      if (!b.due_at) return -1;
      return a.due_at.localeCompare(b.due_at);
    });
  }

  const staleCutoff = new Date(
    now.getTime() - STALE_CONTACT_DAYS * 24 * 3_600_000,
  ).toISOString();
  const nowIso = now.toISOString();

  const agingLeads: AgingLead[] = [];
  for (const lead of leads) {
    if (lead.agent_id === null) continue; // intake pool, handled separately

    const lastTouch = lead.last_contacted_at ?? lead.created_at;
    const staleContact = lastTouch < staleCutoff;

    const leadTasks = openTasksByLead.get(lead.id) ?? [];
    const overdueTask =
      leadTasks.find((t) => t.due_at !== null && t.due_at < nowIso) ?? null;

    if (!staleContact && !overdueTask) continue;

    const candidates = [
      ...(overdueTask?.due_at ? [overdueTask.due_at] : []),
      ...(staleContact ? [lastTouch] : []),
    ];
    agingLeads.push({
      lead,
      staleContact,
      overdueTask,
      nextTask: leadTasks[0] ?? null,
      overdueSince: candidates.sort()[0],
    });
  }
  agingLeads.sort((a, b) => a.overdueSince.localeCompare(b.overdueSince));

  // Broker sees who the appointment belongs to; look up agent names once.
  let agentNameById = new Map<string, string>();
  if (isBroker && appointments.length > 0) {
    const { data: agents } = await db.from("agent").select("id,name");
    agentNameById = new Map((agents ?? []).map((a) => [a.id, a.name]));
  }

  const todayAppointments: TodayAppointment[] = appointments.map((appt) => ({
    ...appt,
    lead: leadById.get(appt.lead_id) ?? null,
    agentName: appt.agent_id ? (agentNameById.get(appt.agent_id) ?? null) : null,
  }));

  const intakePool = isBroker
    ? leads
        .filter((l) => l.agent_id === null)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    : [];

  return {
    agingLeads,
    todayAppointments,
    intakePool,
    openTaskCount: openTasks.length,
  };
}
