-- CRM core slice: status ladders, broker-only dead, contact log, login
-- tracking for "new since last login", and row-level security so agents see
-- only their own leads and the broker sees everything.

-- ---------------------------------------------------------------------------
-- Columns
-- ---------------------------------------------------------------------------

-- "New Leads" = what came in since the agent's previous login.
alter table public.agent add column if not exists last_login_at timestamptz;
alter table public.agent add column if not exists previous_login_at timestamptz;

-- When the lead landed on its current agent (a lead can be created
-- unassigned and handed off later — it's "new" to the agent at handoff).
alter table public.lead add column if not exists assigned_at timestamptz;

-- Agents can't kill a seller lead; they request it and the broker decides.
alter table public.lead add column if not exists dead_requested_at timestamptz;
alter table public.lead add column if not exists dead_requested_by uuid
  references public.agent (id);

-- Buyer leads start at Uncontacted, seller leads at Lead In. The column
-- default stays 'lead_in'; lead_guard() rewrites it for buyers.
alter table public.lead drop constraint if exists lead_status_matches_side;
alter table public.lead add constraint lead_status_matches_side check (
  (side = 'buyer' and status in (
    'uncontacted', 'attempted_contact', 'contacted', 'nurturing',
    'appointment_set', 'pending', 'contract', 'sold'))
  or
  (side = 'seller' and status in (
    'lead_in', 'contact_attempted', 'contact_made', 'nurturing',
    'appointment_set', 'listed', 'sold', 'dead'))
);

alter table public.lead drop constraint if exists lead_dead_request_seller_only;
alter table public.lead add constraint lead_dead_request_seller_only check (
  dead_requested_at is null or side = 'seller'
);

-- Every logged touch: who reached out, how, and what happened.
create table if not exists public.contact_log (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id),
  agent_id uuid references public.agent (id),
  method text not null
    check (method in ('call', 'text', 'email', 'mailer', 'in_person')),
  outcome text not null
    check (outcome in ('reached', 'no_answer', 'left_voicemail', 'sent')),
  body text,
  contacted_at timestamptz not null default now()
);
create index if not exists contact_log_lead_idx
  on public.contact_log (lead_id, contacted_at desc);

create index if not exists lead_agent_idx on public.lead (agent_id);
create index if not exists task_lead_idx on public.task (lead_id);
create index if not exists task_open_agent_idx
  on public.task (agent_id, due_at) where completed_at is null;
create index if not exists note_lead_idx on public.note (lead_id);
create index if not exists status_history_lead_idx
  on public.status_history (lead_id, changed_at);

-- ---------------------------------------------------------------------------
-- Who is asking? (security definer so policies can read agent/lead without
-- recursing through their own RLS)
-- ---------------------------------------------------------------------------

create or replace function public.current_agent_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.agent
  where lower(email) = lower(auth.jwt() ->> 'email') and active
  limit 1
$$;

create or replace function public.is_broker()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.agent
    where lower(email) = lower(auth.jwt() ->> 'email')
      and active and role = 'broker'
  )
$$;

-- SQL editor / migrations (no JWT) and the service-role key are trusted
-- system writers; app rules below apply to signed-in users only.
create or replace function public.request_is_privileged()
returns boolean
language sql stable
as $$
  select auth.jwt() is null
    or coalesce(auth.jwt() ->> 'role', '') = 'service_role'
$$;

create or replace function public.can_access_lead(target uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_broker() or exists (
    select 1 from public.lead
    where id = target and agent_id = public.current_agent_id()
  )
$$;

-- Policies call these as the signed-in user; logged-out visitors get nothing.
revoke execute on function
  public.current_agent_id(), public.is_broker(),
  public.request_is_privileged(), public.can_access_lead(uuid)
  from public, anon;
grant execute on function
  public.current_agent_id(), public.is_broker(),
  public.request_is_privileged(), public.can_access_lead(uuid)
  to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Lead rules
-- ---------------------------------------------------------------------------

create or replace function public.lead_guard()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  allowed boolean := public.request_is_privileged() or public.is_broker();
begin
  if tg_op = 'INSERT' and new.side = 'buyer' and new.status = 'lead_in' then
    new.status := 'uncontacted';
  end if;

  -- Only the broker decides a lead is dead (Phase Two: "only Jason decides").
  if new.status = 'dead'
     and (tg_op = 'INSERT' or old.status is distinct from 'dead')
     and not allowed then
    raise exception 'Only the broker can mark a lead dead — request it instead.'
      using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and old.status = 'dead' and new.status <> 'dead'
     and not allowed then
    raise exception 'Only the broker can reopen a dead lead.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and new.agent_id is distinct from old.agent_id
     and not allowed then
    raise exception 'Only the broker can reassign a lead.'
      using errcode = '42501';
  end if;

  if new.agent_id is null then
    new.assigned_at := null;
  elsif tg_op = 'INSERT' or new.agent_id is distinct from old.agent_id then
    new.assigned_at := now();
  end if;

  -- Stamp a fresh dead request with who asked; a dead verdict closes it.
  if new.status = 'dead' then
    new.dead_requested_at := null;
    new.dead_requested_by := null;
  elsif new.dead_requested_at is not null
        and (tg_op = 'INSERT' or old.dead_requested_at is null) then
    new.dead_requested_at := now();
    new.dead_requested_by := public.current_agent_id();
  elsif new.dead_requested_at is null then
    new.dead_requested_by := null;
  end if;

  return new;
end
$$;

drop trigger if exists lead_guard on public.lead;
create trigger lead_guard
  before insert or update on public.lead
  for each row execute function public.lead_guard();

-- Every status change lands in status_history automatically.
create or replace function public.log_lead_status()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.status_history
      (lead_id, from_status, to_status, changed_by, agent_id)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.status end,
      new.status,
      case
        when public.is_broker() then 'broker'
        when public.current_agent_id() is not null then 'agent'
        else 'anchor'
      end,
      public.current_agent_id()
    );
  end if;
  return new;
end
$$;

drop trigger if exists log_lead_status on public.lead;
create trigger log_lead_status
  after insert or update of status on public.lead
  for each row execute function public.log_lead_status();

-- Logging a contact moves the lead's last-contacted clock.
create or replace function public.touch_last_contacted()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  update public.lead
  set last_contacted_at = greatest(
    coalesce(last_contacted_at, new.contacted_at), new.contacted_at)
  where id = new.lead_id;
  return new;
end
$$;

drop trigger if exists touch_last_contacted on public.contact_log;
create trigger touch_last_contacted
  after insert on public.contact_log
  for each row execute function public.touch_last_contacted();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.contact_log enable row level security;
grant select, insert on public.contact_log to authenticated;

-- Staff directory: any signed-in staff member can see who's on the team.
drop policy if exists agent_select on public.agent;
create policy agent_select on public.agent
  for select to authenticated
  using (public.current_agent_id() is not null);

-- Leads: agents see and work their own; the broker sees all, including
-- unassigned leads.
drop policy if exists lead_select on public.lead;
create policy lead_select on public.lead
  for select to authenticated
  using (public.is_broker() or agent_id = public.current_agent_id());

drop policy if exists lead_insert on public.lead;
create policy lead_insert on public.lead
  for insert to authenticated
  with check (public.is_broker() or agent_id = public.current_agent_id());

drop policy if exists lead_update on public.lead;
create policy lead_update on public.lead
  for update to authenticated
  using (public.is_broker() or agent_id = public.current_agent_id())
  with check (public.is_broker() or agent_id = public.current_agent_id());

drop policy if exists lead_delete on public.lead;
create policy lead_delete on public.lead
  for delete to authenticated
  using (public.is_broker());

-- Tasks, notes, contacts: visible on any lead you can see; written as
-- yourself.
drop policy if exists task_select on public.task;
create policy task_select on public.task
  for select to authenticated
  using (public.can_access_lead(lead_id));

drop policy if exists task_insert on public.task;
create policy task_insert on public.task
  for insert to authenticated
  with check (
    public.can_access_lead(lead_id) and agent_id = public.current_agent_id()
  );

drop policy if exists task_update on public.task;
create policy task_update on public.task
  for update to authenticated
  using (public.can_access_lead(lead_id))
  with check (public.can_access_lead(lead_id));

drop policy if exists note_select on public.note;
create policy note_select on public.note
  for select to authenticated
  using (public.can_access_lead(lead_id));

drop policy if exists note_insert on public.note;
create policy note_insert on public.note
  for insert to authenticated
  with check (
    public.can_access_lead(lead_id) and agent_id = public.current_agent_id()
  );

drop policy if exists contact_log_select on public.contact_log;
create policy contact_log_select on public.contact_log
  for select to authenticated
  using (public.can_access_lead(lead_id));

drop policy if exists contact_log_insert on public.contact_log;
create policy contact_log_insert on public.contact_log
  for insert to authenticated
  with check (
    public.can_access_lead(lead_id) and agent_id = public.current_agent_id()
  );

-- History tables are read-only from the app; triggers and Anchor write them.
drop policy if exists status_history_select on public.status_history;
create policy status_history_select on public.status_history
  for select to authenticated
  using (public.can_access_lead(lead_id));

drop policy if exists message_select on public.message;
create policy message_select on public.message
  for select to authenticated
  using (public.can_access_lead(lead_id));

drop policy if exists activity_select on public.activity;
create policy activity_select on public.activity
  for select to authenticated
  using (lead_id is not null and public.can_access_lead(lead_id));

drop policy if exists appointment_select on public.appointment;
create policy appointment_select on public.appointment
  for select to authenticated
  using (public.can_access_lead(lead_id));
