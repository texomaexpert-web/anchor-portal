"use client";

import { useActionState } from "react";
import { assignLead, type ActionState } from "@/app/(portal)/leads/actions";
import type { StaffMember } from "@/lib/data/leads";
import { FormError, SubmitButton, fieldClass } from "@/components/ui/form";

// Broker only: hand the lead to an agent, or pull it back to the pool.
export function AssignControl({
  leadId,
  agentId,
  staff,
}: {
  leadId: string;
  agentId: string | null;
  staff: StaffMember[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(assignLead, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="lead_id" value={leadId} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="agent_id"
          defaultValue={agentId ?? ""}
          key={agentId ?? "none"}
          className={`${fieldClass} w-auto min-w-48 flex-1`}
          aria-label="Assigned agent"
        >
          <option value="">Unassigned</option>
          {staff
            .filter((s) => s.active || s.id === agentId)
            .map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.role === "broker" ? " (broker)" : ""}
              </option>
            ))}
        </select>
        <SubmitButton variant="quiet">Assign</SubmitButton>
      </div>
      <FormError state={state} />
    </form>
  );
}
