import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Agent, Appointment, Lead, Task } from "@/lib/supabase/database.types";
import { todayBounds } from "@/lib/time";

export type PendingTask = Task & { lead: Lead | null };

export type TodayAppointment = Appointment & {
  lead: Lead | null;
  agentName: string | null;
};

export type DashboardData = {
  // What came in since the previous login (Phase Two: "New Leads across the
  // top"). Null previous login = first visit, so everything counts as new.
  newLeads: Lead[];
  newSince: string | null;
  // The agent's own open follow-ups, earliest due first.
  pendingTasks: PendingTask[];
  // Broker only: unassigned leads waiting for handoff, oldest first.
  intakePool: Lead[];
  todayAppointments: TodayAppointment[];
  agentNameById: Map<string, string>;
};

// Reads run on the session client — RLS limits agents to their own leads
// and lets the broker see everything.
export async function getDashboardData(agent: Agent): Promise<DashboardData> {
  const db = await createClient();
  const isBroker = agent.role === "broker";
  const { start, end } = todayBounds();

  const appointmentsQuery = (
    isBroker
      ? db.from("appointment").select("*")
      : db.from("appointment").select("*").eq("agent_id", agent.id)
  )
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at", { ascending: true });

  const [leadsRes, tasksRes, appointmentsRes, agentsRes] = await Promise.all([
    db.from("lead").select("*"),
    db
      .from("task")
      .select("*, lead(*)")
      .is("completed_at", null)
      .eq("agent_id", agent.id)
      .order("due_at", { ascending: true, nullsFirst: false }),
    appointmentsQuery,
    db.from("agent").select("id,name"),
  ]);

  const firstError =
    leadsRes.error ?? tasksRes.error ?? appointmentsRes.error ?? agentsRes.error;
  if (firstError) {
    throw new Error(`Dashboard query failed: ${firstError.message}`);
  }

  const leads = leadsRes.data ?? [];
  const leadById = new Map(leads.map((l) => [l.id, l]));
  const agentNameById = new Map((agentsRes.data ?? []).map((a) => [a.id, a.name]));

  // The broker sees every new lead as it arrives; an agent sees leads that
  // landed on them (handoff time, falling back to creation).
  const newSince = agent.previous_login_at;
  const arrivedAt = (l: Lead) =>
    isBroker ? l.created_at : (l.assigned_at ?? l.created_at);
  const newLeads = leads
    .filter((l) => isBroker || l.agent_id === agent.id)
    .filter((l) => newSince === null || arrivedAt(l) > newSince)
    .sort((a, b) => arrivedAt(b).localeCompare(arrivedAt(a)));

  const intakePool = isBroker
    ? leads
        .filter((l) => l.agent_id === null)
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
    : [];

  const todayAppointments: TodayAppointment[] = (appointmentsRes.data ?? []).map(
    (appt) => ({
      ...appt,
      lead: leadById.get(appt.lead_id) ?? null,
      agentName: appt.agent_id ? (agentNameById.get(appt.agent_id) ?? null) : null,
    }),
  );

  return {
    newLeads,
    newSince,
    pendingTasks: tasksRes.data ?? [],
    intakePool,
    todayAppointments,
    agentNameById,
  };
}
