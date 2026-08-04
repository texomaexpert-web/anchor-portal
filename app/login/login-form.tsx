"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    login,
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          className="h-11 rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent focus:ring-2 focus:ring-accent/15"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-ink">Password</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="h-11 rounded-lg border border-line bg-surface px-3.5 text-[15px] text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/15"
          placeholder="••••••••"
        />
      </label>

      {state?.error && (
        <p className="rounded-lg bg-rust-soft px-3.5 py-2.5 text-sm text-rust">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-11 rounded-lg bg-accent text-[15px] font-medium text-white transition-colors hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
