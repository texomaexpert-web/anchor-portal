"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type LoginState = { error: string } | null;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "That email and password didn't match. Try again." };
  }

  await recordLogin(email);
  redirect("/");
}

// Roll the login clock: the dashboard's "New Leads" are whatever arrived
// since the previous login. Service-role write — agents can't edit their
// own agent row.
async function recordLogin(email: string) {
  const db = createAdminClient();
  const { data: agent } = await db
    .from("agent")
    .select("id,last_login_at")
    .ilike("email", email)
    .maybeSingle();
  if (!agent) return; // layout shows the no-agent-record screen

  await db
    .from("agent")
    .update({
      previous_login_at: agent.last_login_at,
      last_login_at: new Date().toISOString(),
    })
    .eq("id", agent.id);
}
