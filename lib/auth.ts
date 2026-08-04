import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Agent } from "@/lib/supabase/database.types";

export type SessionAgent = {
  email: string;
  agent: Agent | null;
};

// The signed-in user plus their `agent` row, matched by email. Cached per
// request so layout and page can both call it with a single round trip.
export const getSessionAgent = cache(async (): Promise<SessionAgent> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect("/login");
  }

  const db = createAdminClient();
  const { data: agent, error } = await db
    .from("agent")
    .select("*")
    .ilike("email", user.email)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load agent record: ${error.message}`);
  }

  return { email: user.email, agent };
});
