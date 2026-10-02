"use client";

import { useActionState } from "react";
import { addNote, type ActionState } from "@/app/(portal)/leads/actions";
import { FormError, SubmitButton, fieldClass } from "@/components/ui/form";

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action] = useActionState<ActionState, FormData>(addNote, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="lead_id" value={leadId} />
      <textarea
        name="body"
        rows={3}
        className={fieldClass}
        placeholder="What happened, what they said, what's next…"
        aria-label="Note"
      />
      <FormError state={state} />
      <div>
        <SubmitButton variant="quiet">Add note</SubmitButton>
      </div>
    </form>
  );
}
