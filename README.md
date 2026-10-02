# Anchor Portal

Internal staff portal for American Dream Realty (Texoma Corridor). A single
login-gated shell that houses staff tools — the Agent Dashboard is live;
Inspector and Studio move in later.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres + Auth) via `@supabase/supabase-js` and `@supabase/ssr`
- Deploys to Vercel

## Setup

1. Copy `.env.example` to `.env.local` and paste in your Supabase keys.
   The service role key is server-only — never prefix it with `NEXT_PUBLIC_`.

2. Install and run:

   ```
   npm install
   npm run dev
   ```

   Open http://localhost:3000 — you'll hit the login page.

3. To sign in you need two things that match by email:
   - An auth user: Supabase dashboard → Authentication → Users → Add user.
   - A matching `agent` row (SQL Editor):

     ```sql
     insert into agent (name, email, role)
     values ('Your Name', 'you@youremail.com', 'broker');
     ```

## Database migrations

The schema lives in `supabase/migrations/`, applied in filename order:

1. `…_baseline_schema.sql` — the tables that already existed live (no-op there)
2. `…_buyer_status_values.sql` — buyer-ladder status values
3. `…_crm_core.sql` — contact log, dead requests, login tracking, RLS

No CLI needed: paste each file into Supabase → SQL Editor → Run, **one file
per run, in order** (Postgres won't use a new enum value in the same run that
adds it). Every file is safe to re-run.

## How data access works

Row-level security decides who sees what:

- **Agents** see and work only leads assigned to them (and those leads'
  tasks, notes, contacts, history).
- **The broker** sees every lead, including unassigned ones.
- Only the broker can assign leads, mark a seller lead dead, or reopen a dead
  lead. Agents can *request* dead; the broker decides. Enforced by the
  `lead_guard` trigger.

CRM pages read and write through the session-scoped client
(`lib/supabase/server.ts`), so RLS applies. The service-role client
(`lib/supabase/admin.ts`) is only used to look up the signed-in user's agent
row and stamp login times.

## Layout

- `proxy.ts` — session refresh + login gate for every route
- `app/login` — email/password sign-in
- `app/(portal)` — protected shell (sidebar nav) + Agent Dashboard
- `app/(portal)/leads` — leads table, add-lead form, lead detail, actions
- `lib/leads` — status ladders, next-task timing rule, task types
- `lib/data` — dashboard and lead queries
- `lib/supabase` — clients + database types
- `supabase/migrations` — schema + RLS
