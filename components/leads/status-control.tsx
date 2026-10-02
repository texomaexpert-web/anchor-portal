"use client";

import { useActionState, useState } from "react";
import {
  markDead,
  requestDead,
  updateStatus,
  withdrawDeadRequest,
  type ActionState,
} from "@/app/(portal)/leads/actions";
import type { Lead } from "@/lib/supabase/database.types";
import { DEAD, STATUS_LADDERS, canBeDead, statusLabel } from "@/lib/leads/status";
import { FormError, SubmitButton, fieldClass } from "@/components/ui/form";

export function StatusControl({
  lead,
  isBroker,
  requestedByName,
}: {
  lead: Pick<Lead, "id" | "side" | "status" | "dead_requested_at">;
  isBroker: boolean;
  requestedByName: string | null;
}) {
  const [state, action] = useActionState<ActionState, FormData>(updateStatus, null);
  const [confirmingDead, setConfirmingDead] = useState(false);
  const isDead = lead.status === DEAD;
  const ladder = STATUS_LADDERS[lead.side];

  return (
    <div className="flex flex-col gap-3">
      {isDead && !isBroker ? (
        <p className="text-sm text-ink-muted">
          Marked dead by the broker. Only the broker can reopen it.
        </p>
      ) : (
        <form action={action} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="lead_id" value={lead.id} />
          <select
            name="status"
            defaultValue={isDead ? ladder[0] : lead.status}
            key={lead.status}
            className={`${fieldClass} w-auto min-w-48 flex-1`}
            aria-label="Status"
          >
            {ladder.map((s, i) => (
              <option key={s} value={s}>
                {i + 1}. {statusLabel(s)}
              </option>
            ))}
          </select>
          <SubmitButton variant="quiet">{isDead ? "Reopen" : "Update"}</SubmitButton>
        </form>
      )}
      <FormError state={state} />

      {canBeDead(lead.side) && !isDead && (
        <div className="border-t border-hairline pt-3">
          {lead.dead_requested_at ? (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-aging">
                {requestedByName ?? "An agent"} asked to mark this lead dead.
                {isBroker ? " Your call." : " Waiting on the broker."}
              </p>
              <div className="flex flex-wrap gap-2">
                {isBroker && (
                  <form action={markDead}>
                    <input type="hidden" name="lead_id" value={lead.id} />
                    <SubmitButton variant="danger">Mark dead</SubmitButton>
                  </form>
                )}
                <form action={withdrawDeadRequest}>
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <SubmitButton variant="quiet">
                    {isBroker ? "Keep working it" : "Withdraw request"}
                  </SubmitButton>
                </form>
              </div>
            </div>
          ) : isBroker ? (
            confirmingDead ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-ink-muted">
                  Dead leads stop being worked. Sure?
                </span>
                <form action={markDead}>
                  <input type="hidden" name="lead_id" value={lead.id} />
                  <SubmitButton variant="danger">Yes, mark dead</SubmitButton>
                </form>
                <button
                  type="button"
                  onClick={() => setConfirmingDead(false)}
                  className="px-2 text-sm text-ink-muted hover:text-ink"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmingDead(true)}
                className="text-sm text-ink-faint hover:text-overdue"
              >
                Mark dead…
              </button>
            )
          ) : (
            <form action={requestDead} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="lead_id" value={lead.id} />
              <SubmitButton variant="quiet">Request dead</SubmitButton>
              <span className="text-xs text-ink-faint">
                Only the broker can mark a seller lead dead.
              </span>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
