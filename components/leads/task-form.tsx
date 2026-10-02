"use client";

import { useActionState, useEffect, useId } from "react";
import { addTask, type ActionState } from "@/app/(portal)/leads/actions";
import { TASK_TYPES, TASK_TYPE_LABELS, type TaskType } from "@/lib/leads/tasks";
import { FormError, SubmitButton, fieldClass, labelClass } from "@/components/ui/form";

export function TaskForm({
  leadId,
  defaultDueDate,
  defaultType = "follow_up",
  submitLabel = "Add task",
  onScheduled,
}: {
  leadId: string;
  defaultDueDate: string;
  defaultType?: TaskType;
  submitLabel?: string;
  onScheduled?: () => void;
}) {
  const [state, action] = useActionState<ActionState, FormData>(addTask, null);
  const id = useId();

  useEffect(() => {
    if (state && "ok" in state) onScheduled?.();
  }, [state, onScheduled]);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="lead_id" value={leadId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor={`${id}-type`}>Task</label>
          <select id={`${id}-type`} name="type" defaultValue={defaultType} className={fieldClass}>
            {TASK_TYPES.map((t) => (
              <option key={t} value={t}>
                {TASK_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor={`${id}-due`}>Due</label>
          <input
            id={`${id}-due`}
            type="date"
            name="due_date"
            defaultValue={defaultDueDate}
            className={`${fieldClass} font-mono tabular-nums [color-scheme:dark]`}
          />
        </div>
      </div>
      <input
        name="detail"
        className={fieldClass}
        placeholder="Detail (optional)"
        aria-label="Task detail"
      />
      <FormError state={state} />
      <div>
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
