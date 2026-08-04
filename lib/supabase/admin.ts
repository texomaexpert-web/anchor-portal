import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Service-role client — bypasses RLS. RLS is enabled on every table with no
// policies yet, so ALL table reads and writes must go through this client,
// and only ever on the server. The `server-only` import makes any client
// bundle that touches this file fail the build.
// TODO: per-agent RLS policies — once policies exist, move reads to the
// session-scoped client and retire most uses of this one.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
