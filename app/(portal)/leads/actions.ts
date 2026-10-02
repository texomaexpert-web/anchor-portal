"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSessionAgent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  ContactMethod,
  ContactOutcome,
  LeadSide,
} from "@/lib/supabase/database.types";
import { DEAD, canBeDead, firstStatus, isLadderStatus } from "@/lib/leads/status";
import { lastHeardFrom, suggestNextTask, type NextTaskSuggestion } from "@/lib/leads/next-task";
import { TASK_TYPES } from "@/lib/leads/tasks";
import { localDateToUtc } from "@/lib/time";

// Every action re-checks who's asking. Writes run on the session client, so
// row-level security and the lead_guard trigger have the final say — these
// checks exist to give a readable error first.

export type ActionState = { error: string } | { ok: true } | null;

async function requireAgent() {
  const { agent } = await getSessionAgent();
  if (!agent) throw new Error("No agent record for this login.");
  return agent;
}

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function refreshLead(leadId: string) {
  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  revalidatePath("/");
}

const CONTACT_METHODS: ContactMethod[] = ["call", "text", "email", "mailer", "in_person"];
const CONTACT_OUTCOMES: ContactOutcome[] = ["reached", "no_answer", "left_voicemail", "sent"];

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------

export async function createLead(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const agent = await requireAgent();
  const isBroker = agent.role === "broker";

  const firstName = text(formData, "first_name");
  const lastName = text(formData, "last_name");
  const phone = text(formData, "phone");
  const email = text(formData, "email");
  const side = text(formData, "side") as LeadSide;
  const source = text(formData, "source");
  // Agents can only add leads to their own book; the broker picks anyone,
  // or leaves it unassigned.
  const agentId = isBroker ? text(formData, "agent_id") || null : agent.id;

  if (!firstName && !lastName) return { error: "Give the lead a name." };
  if (!phone && !email) return { error: "Add a phone number or an email." };
  if (side !== "buyer" && side !== "seller") return { error: "Pick buyer or seller." };

  const db = await createClient();
  const { data, error } = await db
    .from("lead")
    .insert({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      email: email || null,
      side,
      status: firstStatus(side),
      source: source || null,
      agent_id: agentId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/leads");
  revalidatePath("/");
  redirect(`/leads/${data.id}`);
}

export async function updateStatus(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const agent = await requireAgent();
  const leadId = text(formData, "lead_id");
  const status = text(formData, "status");

  const db = await createClient();
  const { data: lead } = await db
    .from("lead")
    .select("side,status")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { error: "Lead not found." };

  if (!isLadderStatus(lead.side, status)) {
    return { error: "That status isn't on this lead's ladder." };
  }
  if (lead.status === DEAD && agent.role !== "broker") {
    return { error: "Only the broker can reopen a dead lead." };
  }

  const { error } = await db.from("lead").update({ status }).eq("id", leadId);
  if (error) return { error: error.message };

  refreshLead(leadId);
  return { ok: true };
}

// Agent side of "only Jason decides": flag it and let the broker rule.
export async function requestDead(formData: FormData): Promise<void> {
  await requireAgent();
  const leadId = text(formData, "lead_id");
  const db = await createClient();
  const { data: lead } = await db
    .from("lead")
    .select("side")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead || !canBeDead(lead.side)) return;

  await db
    .from("lead")
    .update({ dead_requested_at: new Date().toISOString() })
    .eq("id", leadId);
  refreshLead(leadId);
}

export async function withdrawDeadRequest(formData: FormData): Promise<void> {
  await requireAgent();
  const leadId = text(formData, "lead_id");
  const db = await createClient();
  await db.from("lead").update({ dead_requested_at: null }).eq("id", leadId);
  refreshLead(leadId);
}

export async function markDead(formData: FormData): Promise<void> {
  const agent = await requireAgent();
  if (agent.role !== "broker") throw new Error("Only the broker can mark a lead dead.");

  const leadId = text(formData, "lead_id");
  const db = await createClient();
  const { error } = await db.from("lead").update({ status: DEAD }).eq("id", leadId);
  if (error) throw new Error(error.message);
  refreshLead(leadId);
}

export async function assignLead(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const agent = await requireAgent();
  if (agent.role !== "broker") return { error: "Only the broker can assign leads." };

  const leadId = text(formData, "lead_id");
  const agentId = text(formData, "agent_id") || null;

  const db = await createClient();
  const { error } = await db
    .from("lead")
    .update({ agent_id: agentId })
    .eq("id", leadId);
  if (error) return { error: error.message };

  refreshLead(leadId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Notes, tasks, contacts
// ---------------------------------------------------------------------------

export async function addNote(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const agent = await requireAgent();
  const leadId = text(formData, "lead_id");
  const body = text(formData, "body");
  if (!body) return { error: "Write something first." };

  const db = await createClient();
  const { error } = await db
    .from("note")
    .insert({ lead_id: leadId, agent_id: agent.id, body });
  if (error) return { error: error.message };

  refreshLead(leadId);
  return { ok: true };
}

export async function addTask(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const agent = await requireAgent();
  const leadId = text(formData, "lead_id");
  const type = text(formData, "type");
  const dueDate = text(formData, "due_date");
  const detail = text(formData, "detail");

  if (!(TASK_TYPES as readonly string[]).includes(type)) {
    return { error: "Pick a task type." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return { error: "Pick a due date." };

  const db = await createClient();
  const { error } = await db.from("task").insert({
    lead_id: leadId,
    agent_id: agent.id,
    type,
    detail: detail || null,
    due_at: localDateToUtc(dueDate).toISOString(),
    created_by: agent.role,
  });
  if (error) return { error: error.message };

  refreshLead(leadId);
  return { ok: true };
}

export async function completeTask(formData: FormData): Promise<void> {
  await requireAgent();
  const taskId = text(formData, "task_id");
  const leadId = text(formData, "lead_id");

  const db = await createClient();
  const { error } = await db
    .from("task")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw new Error(error.message);

  refreshLead(leadId);
}

export type LogContactState =
  | { error: string }
  | { ok: true; suggestion: NextTaskSuggestion; contactId: string }
  | null;

// Log the touch, then hand back the next-task offer per the Notion rule.
export async function logContact(
  _prev: LogContactState,
  formData: FormData,
): Promise<LogContactState> {
  const agent = await requireAgent();
  const leadId = text(formData, "lead_id");
  const method = text(formData, "method") as ContactMethod;
  const outcome = text(formData, "outcome") as ContactOutcome;
  const body = text(formData, "body");

  if (!CONTACT_METHODS.includes(method)) return { error: "How did you reach out?" };
  if (!CONTACT_OUTCOMES.includes(outcome)) return { error: "What happened?" };

  const db = await createClient();
  const { data: contact, error } = await db
    .from("contact_log")
    .insert({ lead_id: leadId, agent_id: agent.id, method, outcome, body: body || null })
    .select("id")
    .single();
  if (error) return { error: error.message };

  const [leadRes, reachedRes, inboundRes] = await Promise.all([
    db.from("lead").select("created_at,last_activity_at").eq("id", leadId).single(),
    db
      .from("contact_log")
      .select("contacted_at")
      .eq("lead_id", leadId)
      .eq("outcome", "reached")
      .order("contacted_at", { ascending: false })
      .limit(1),
    db
      .from("message")
      .select("sent_at")
      .eq("lead_id", leadId)
      .eq("direction", "inbound")
      .order("sent_at", { ascending: false })
      .limit(1),
  ]);
  if (leadRes.error) return { error: leadRes.error.message };

  const heard = lastHeardFrom(leadRes.data.created_at, [
    leadRes.data.last_activity_at,
    reachedRes.data?.[0]?.contacted_at,
    inboundRes.data?.[0]?.sent_at,
  ]);

  refreshLead(leadId);
  return { ok: true, suggestion: suggestNextTask(heard), contactId: contact.id };
}
