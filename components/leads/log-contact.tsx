"use client";

import { useActionState, useCallback, useId, useState } from "react";
import { logContact, type LogContactState } from "@/app/(portal)/leads/actions";
import type { ContactMethod, ContactOutcome } from "@/lib/supabase/database.types";
import { CONTACT_METHOD_LABELS, CONTACT_OUTCOME_LABELS } from "@/lib/leads/tasks";
import { FormError, SubmitButton, fieldClass, labelClass } from "@/components/ui/form";
import { TaskForm } from "./task-form";

// Log a touch. On success, offer the next task pre-filled per the Phase Two
// timing rule — the standard is: after every contact, schedule the next task
// and make notes.
export function LogContact({ leadId }: { leadId: string }) {
  const [state, action] = useActionState<LogContactState, FormData>(logContact, null);
  const [handledId, setHandledId] = useState<string | null>(null);
  const [scheduledId, setScheduledId] = useState<string | null>(null);
  const id = useId();

  const logged = state && "ok" in state ? state : null;
  const offer = logged && logged.contactId !== handledId ? logged : null;
  const justScheduled = logged !== null && logged.contactId === scheduledId;

  const onScheduled = useCallback(() => {
    if (!logged) return;
    setScheduledId(logged.contactId);
    setHandledId(logged.contactId);
  }, [logged]);

  if (offer) {
    return (
      <div className="flex flex-col gap-3 rounded-lg border border-accent/30 bg-accent/5 p-4">
        <div>
          <p className="text-sm font-medium text-ink">
            Contact logged. Schedule the next task?
          </p>
          <p className="mt-0.5 text-xs text-ink-muted">{offer.suggestion.reason}</p>
        </div>
        <TaskForm
          key={offer.contactId}
          leadId={leadId}
          defaultDueDate={offer.suggestion.dueDate}
          submitLabel="Schedule it"
          onScheduled={onScheduled}
        />
        <button
          type="button"
          onClick={() => setHandledId(offer.contactId)}
          className="self-start text-xs text-ink-faint hover:text-ink-muted"
        >
          Skip for now
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="lead_id" value={leadId} />
      {justScheduled && <p className="text-sm text-accent">Next task scheduled.</p>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${id}-method`}>How</label>
          <select id={`${id}-method`} name="method" defaultValue="call" className={fieldClass}>
            {(Object.keys(CONTACT_METHOD_LABELS) as ContactMethod[]).map((m) => (
              <option key={m} value={m}>
                {CONTACT_METHOD_LABELS[m]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${id}-outcome`}>Result</label>
          <select
            id={`${id}-outcome`}
            name="outcome"
            defaultValue="no_answer"
            className={fieldClass}
          >
            {(Object.keys(CONTACT_OUTCOME_LABELS) as ContactOutcome[]).map((o) => (
              <option key={o} value={o}>
                {CONTACT_OUTCOME_LABELS[o]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <textarea
        name="body"
        rows={2}
        className={fieldClass}
        placeholder="What happened? (optional)"
        aria-label="Contact notes"
      />
      <FormError state={state} />
      <div>
        <SubmitButton>Log contact</SubmitButton>
      </div>
    </form>
  );
}
