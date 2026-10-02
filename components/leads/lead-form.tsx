"use client";

import { useActionState } from "react";
import { createLead, type ActionState } from "@/app/(portal)/leads/actions";
import type { StaffMember } from "@/lib/data/leads";
import { FormError, SubmitButton, fieldClass, labelClass } from "@/components/ui/form";

export function LeadForm({
  isBroker,
  staff,
}: {
  isBroker: boolean;
  staff: StaffMember[];
}) {
  const [state, action] = useActionState<ActionState, FormData>(createLead, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className={labelClass}>First name</label>
          <input id="first_name" name="first_name" className={fieldClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="last_name" className={labelClass}>Last name</label>
          <input id="last_name" name="last_name" className={fieldClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="phone" className={labelClass}>Phone</label>
          <input id="phone" name="phone" type="tel" className={fieldClass} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" name="email" type="email" className={fieldClass} autoComplete="off" />
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Type</legend>
        <div className="flex gap-2">
          {(["buyer", "seller"] as const).map((side) => (
            <label
              key={side}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-hairline-strong bg-raised px-3 py-2 text-sm capitalize text-ink-muted has-[:checked]:border-accent/60 has-[:checked]:text-ink"
            >
              <input
                type="radio"
                name="side"
                value={side}
                defaultChecked={side === "buyer"}
                className="accent-accent"
              />
              {side}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="source" className={labelClass}>Source</label>
          <input
            id="source"
            name="source"
            className={fieldClass}
            placeholder="e.g. Website, Referral, Test"
            defaultValue="Manual entry"
          />
        </div>
        {isBroker && (
          <div>
            <label htmlFor="agent_id" className={labelClass}>Assigned agent</label>
            <select id="agent_id" name="agent_id" className={fieldClass} defaultValue="">
              <option value="">Unassigned</option>
              {staff
                .filter((s) => s.active)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.role === "broker" ? " (broker)" : ""}
                  </option>
                ))}
            </select>
          </div>
        )}
      </div>

      <FormError state={state} />
      <div>
        <SubmitButton pendingLabel="Adding…">Add lead</SubmitButton>
      </div>
    </form>
  );
}
