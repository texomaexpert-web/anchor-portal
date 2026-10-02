import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  Activity,
  Agent,
  Appointment,
  ContactLog,
  Lead,
  LeadSide,
  LeadStatus,
  Message,
  Note,
  StatusHistory,
  Task,
} from "@/lib/supabase/database.types";

// CRM reads go through the session-scoped client, so row-level security
// decides what comes back: agents get their own leads, the broker gets all.

export type StaffMember = Pick<Agent, "id" | "name" | "role" | "active">;

export async function listStaff(): Promise<StaffMember[]> {
  const db = await createClient();
  const { data, error } = await db
    .from("agent")
    .select("id,name,role,active")
    .order("name");
  if (error) throw new Error(`Failed to load agents: ${error.message}`);
  return data ?? [];
}

export type LeadFilters = {
  side?: LeadSide;
  status?: LeadStatus;
  // An agent id, or "unassigned".
  agent?: string;
  deadRequested?: boolean;
};

export async function listLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const db = await createClient();
  let query = db
    .from("lead")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.side) query = query.eq("side", filters.side);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.agent === "unassigned") query = query.is("agent_id", null);
  else if (filters.agent) query = query.eq("agent_id", filters.agent);
  if (filters.deadRequested) query = query.not("dead_requested_at", "is", null);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load leads: ${error.message}`);
  return data ?? [];
}

export type LeadDetail = {
  lead: Lead;
  tasks: Task[];
  notes: Note[];
  contacts: ContactLog[];
  statusHistory: StatusHistory[];
  messages: Message[];
  activity: Activity[];
  appointments: Appointment[];
};

// Null when the lead doesn't exist or RLS hides it from this user.
export async function getLeadDetail(id: string): Promise<LeadDetail | null> {
  const db = await createClient();

  const { data: lead, error } = await db
    .from("lead")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Failed to load lead: ${error.message}`);
  if (!lead) return null;

  const [tasks, notes, contacts, statusHistory, messages, activity, appointments] =
    await Promise.all([
      db.from("task").select("*").eq("lead_id", id).order("due_at", { ascending: true, nullsFirst: false }),
      db.from("note").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      db.from("contact_log").select("*").eq("lead_id", id).order("contacted_at", { ascending: false }),
      db.from("status_history").select("*").eq("lead_id", id).order("changed_at", { ascending: false }),
      db.from("message").select("*").eq("lead_id", id).order("sent_at", { ascending: false }),
      db.from("activity").select("*").eq("lead_id", id).order("occurred_at", { ascending: false }).limit(200),
      db.from("appointment").select("*").eq("lead_id", id).order("starts_at", { ascending: false }),
    ]);

  const firstError =
    tasks.error ?? notes.error ?? contacts.error ?? statusHistory.error ??
    messages.error ?? activity.error ?? appointments.error;
  if (firstError) throw new Error(`Failed to load lead history: ${firstError.message}`);

  return {
    lead,
    tasks: tasks.data ?? [],
    notes: notes.data ?? [],
    contacts: contacts.data ?? [],
    statusHistory: statusHistory.data ?? [],
    messages: messages.data ?? [],
    activity: activity.data ?? [],
    appointments: appointments.data ?? [],
  };
}
