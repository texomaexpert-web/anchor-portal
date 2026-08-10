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
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
          Email
        </span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          className="h-10 rounded-lg border border-hairline-strong bg-raised px-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-ink-muted">
          Password
        </span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="h-10 rounded-lg border border-hairline-strong bg-raised px-3 text-sm text-ink outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/15"
          placeholder="••••••••"
        />
      </label>

      {state?.error && (
        <p className="rounded-lg border border-overdue/30 bg-overdue/10 px-3 py-2.5 text-xs text-overdue">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-10 rounded-lg bg-accent text-sm font-medium text-bg transition-colors hover:bg-accent/85 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
