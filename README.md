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

## How data access works (for now)

RLS is enabled on every table with no policies yet, so all reads and writes
happen on the server through the service-role client
(`lib/supabase/admin.ts`), which bypasses RLS. Role scoping (`agent` vs
`broker`) is enforced in the query layer (`lib/data/dashboard.ts`).
Per-agent RLS policies are a TODO — once they exist, reads move to the
session-scoped client.

## Layout

- `proxy.ts` — session refresh + login gate for every route
- `app/login` — email/password sign-in
- `app/(portal)` — protected shell (sidebar nav) + Agent Dashboard
- `lib/supabase` — clients + database types
- `lib/data/dashboard.ts` — dashboard queries (aging leads, appointments, intake pool)
