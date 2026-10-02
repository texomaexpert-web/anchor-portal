-- Baseline: the schema that already exists in the live Supabase project,
-- captured so the repo is the source of truth from here on. Every statement
-- is idempotent — running this against the live database changes nothing.
--
-- Not captured: the `claim_session` RPC (backfills activity.lead_id by
-- session). It exists live but its body isn't visible from the app; dump it
-- with `supabase db dump` when the CLI is set up.

do $$ begin
  create type public.agent_role as enum ('agent', 'broker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_side as enum ('buyer', 'seller');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.lead_status as enum (
    'lead_in', 'contact_attempted', 'contact_made', 'nurturing',
    'appointment_set', 'listed', 'pending', 'under_contract', 'sold', 'dead'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_direction as enum ('inbound', 'outbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.message_channel as enum ('sms', 'email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_event as enum (
    'listing_view', 'search', 'site_visit', 'saved_listing', 'form_submit'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_type as enum (
    'showing', 'listing_consult', 'buyer_consult', 'closing', 'other'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.agent (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null constraint agent_email_key unique,
  phone text,
  role public.agent_role not null default 'agent',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.lead (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  phone text,
  email text,
  side public.lead_side not null,
  status public.lead_status not null default 'lead_in',
  source text,
  agent_id uuid references public.agent (id),
  created_at timestamptz not null default now(),
  last_activity_at timestamptz,
  last_contacted_at timestamptz,
  notes_summary text
);
comment on column public.lead.agent_id is
  'Null until handoff. Null leads appear only on the broker view.';
comment on column public.lead.last_activity_at is
  'Most recent row in activity. Drives the warming/cooling signal.';

create table if not exists public.message (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id),
  direction public.message_direction not null,
  channel public.message_channel not null,
  body text not null,
  sent_by text not null default 'anchor',
  agent_id uuid references public.agent (id),
  sent_at timestamptz not null default now(),
  external_id text
);
comment on column public.message.sent_by is 'anchor | agent | lead';
comment on column public.message.external_id is
  'Twilio SID or email message id, for dedupe.';

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.lead (id),
  session_id text not null,
  event_type public.activity_event not null,
  listing_id text,
  listing_address text,
  search_criteria jsonb,
  page_url text,
  occurred_at timestamptz not null default now()
);
comment on column public.activity.lead_id is
  'Null while anonymous. Backfilled by session_id the moment they identify.';
comment on column public.activity.search_criteria is
  'Price, beds, area, filters — as submitted.';

create table if not exists public.task (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id),
  agent_id uuid references public.agent (id),
  type text not null,
  detail text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by text not null default 'anchor',
  created_at timestamptz not null default now()
);

create table if not exists public.note (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id),
  agent_id uuid references public.agent (id),
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.appointment (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id),
  agent_id uuid references public.agent (id),
  type public.appointment_type not null default 'showing',
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  reminder_sent_at timestamptz,
  outcome text,
  created_at timestamptz not null default now()
);

create table if not exists public.status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.lead (id),
  from_status public.lead_status,
  to_status public.lead_status not null,
  changed_by text not null default 'anchor',
  agent_id uuid references public.agent (id),
  changed_at timestamptz not null default now()
);

alter table public.agent enable row level security;
alter table public.lead enable row level security;
alter table public.message enable row level security;
alter table public.activity enable row level security;
alter table public.task enable row level security;
alter table public.note enable row level security;
alter table public.appointment enable row level security;
alter table public.status_history enable row level security;
