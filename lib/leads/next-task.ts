import { addDays, daysAgo, localDateString } from "@/lib/time";

// Phase Two (Notion, locked): after a contact, schedule the next task
// "Default: 7 days out, or 3 days if the lead has already been quiet longer
// than 7."
export const NEXT_TASK_DAYS = 7;
export const QUIET_NEXT_TASK_DAYS = 3;
export const QUIET_AFTER_DAYS = 7;

export type NextTaskSuggestion = {
  daysOut: number;
  // YYYY-MM-DD (Central), ready for a date input.
  dueDate: string;
  quietDays: number;
  reason: string;
};

// "Quiet" = time since we last heard from the lead: whichever is latest of
// the lead arriving, their last website activity, a contact where the agent
// actually reached them, or an inbound message.
export function lastHeardFrom(
  leadCreatedAt: string,
  others: (string | null | undefined)[],
): string {
  return others.reduce<string>(
    (latest, t) => (t && t > latest ? t : latest),
    leadCreatedAt,
  );
}

export function suggestNextTask(
  lastHeardFromIso: string,
  now = new Date(),
): NextTaskSuggestion {
  const quietDays = Math.max(0, daysAgo(lastHeardFromIso, now));
  const quiet = quietDays > QUIET_AFTER_DAYS;
  const daysOut = quiet ? QUIET_NEXT_TASK_DAYS : NEXT_TASK_DAYS;
  return {
    daysOut,
    dueDate: localDateString(addDays(now, daysOut)),
    quietDays,
    reason: quiet
      ? `Quiet ${quietDays} days — follow up in ${daysOut}.`
      : `Standard follow-up: ${daysOut} days out.`,
  };
}
