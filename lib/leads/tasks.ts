import type { ContactMethod, ContactOutcome } from "@/lib/supabase/database.types";

// The touches the seller contact protocol names (call, text, mailer) plus
// email and a catch-all follow-up.
export const TASK_TYPES = ["follow_up", "call", "text", "email", "mailer"] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  follow_up: "Follow up",
  call: "Call",
  text: "Text",
  email: "Email",
  mailer: "Mailer",
};

export function taskTypeLabel(type: string): string {
  return TASK_TYPE_LABELS[type as TaskType] ?? type.replaceAll("_", " ");
}

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  call: "Call",
  text: "Text",
  email: "Email",
  mailer: "Mailer",
  in_person: "In person",
};

export const CONTACT_OUTCOME_LABELS: Record<ContactOutcome, string> = {
  reached: "Reached them",
  no_answer: "No answer",
  left_voicemail: "Left voicemail",
  sent: "Sent (no reply yet)",
};
