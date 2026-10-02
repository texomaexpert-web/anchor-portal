import type { LeadSide, LeadStatus } from "@/lib/supabase/database.types";

// Status ladders, exactly as locked in Phase Two (Notion, July 12 2026).
// The database enforces the same lists (lead_status_matches_side).
export const STATUS_LADDERS: Record<LeadSide, readonly LeadStatus[]> = {
  seller: [
    "lead_in",
    "contact_attempted",
    "contact_made",
    "nurturing",
    "appointment_set",
    "listed",
    "sold",
  ],
  buyer: [
    "uncontacted",
    "attempted_contact",
    "contacted",
    "nurturing",
    "appointment_set",
    "pending",
    "contract",
    "sold",
  ],
};

// Off-ladder terminal state. Seller only, broker only — agents request it.
export const DEAD: LeadStatus = "dead";

export const STATUS_LABELS: Record<LeadStatus, string> = {
  lead_in: "Lead In",
  contact_attempted: "Contact Attempted",
  contact_made: "Contact Made",
  nurturing: "Nurturing",
  appointment_set: "Appointment Set",
  listed: "Listed",
  pending: "Pending",
  under_contract: "Under Contract", // legacy enum value, on no ladder
  sold: "Sold",
  dead: "Dead",
  uncontacted: "Uncontacted",
  attempted_contact: "Attempted Contact",
  contacted: "Contacted",
  contract: "Contract",
};

export function statusLabel(status: LeadStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export function firstStatus(side: LeadSide): LeadStatus {
  return STATUS_LADDERS[side][0];
}

// Statuses a user may pick for a lead. Dead is handled by its own controls.
export function isLadderStatus(side: LeadSide, status: string): status is LeadStatus {
  return (STATUS_LADDERS[side] as readonly string[]).includes(status);
}

export function canBeDead(side: LeadSide): boolean {
  return side === "seller";
}
