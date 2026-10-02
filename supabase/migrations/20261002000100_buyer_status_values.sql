-- The live lead_status enum was built around the seller ladder. Add the
-- buyer-only rungs from the locked Phase Two ladder:
--   Buyer: Uncontacted → Attempted Contact → Contacted → Nurturing →
--          Appointment Set → Pending → Contract → Sold
-- (nurturing, appointment_set, pending, sold are shared with sellers.)
--
-- Kept in its own migration: Postgres won't let a new enum value be used in
-- the same transaction that adds it.

alter type public.lead_status add value if not exists 'uncontacted';
alter type public.lead_status add value if not exists 'attempted_contact';
alter type public.lead_status add value if not exists 'contacted';
alter type public.lead_status add value if not exists 'contract';
