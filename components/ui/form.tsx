"use client";

import { useFormStatus } from "react-dom";

export const fieldClass =
  "w-full rounded-lg border border-hairline-strong bg-raised px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-accent/60 focus:outline-none";

export const labelClass =
  "mb-1.5 block text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  variant?: "primary" | "quiet" | "danger";
}) {
  const { pending } = useFormStatus();
  const styles = {
    primary: "bg-accent text-bg hover:bg-accent/90",
    quiet:
      "border border-hairline-strong bg-raised text-ink-muted hover:text-ink",
    danger:
      "border border-overdue/40 bg-overdue/10 text-overdue hover:bg-overdue/20",
  }[variant];
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${styles}`}
    >
      {pending ? (pendingLabel ?? "Saving…") : children}
    </button>
  );
}

export function FormError({ state }: { state: unknown }) {
  if (!state || typeof state !== "object" || !("error" in state)) return null;
  return (
    <p role="alert" className="text-sm text-overdue">
      {String((state as { error: string }).error)}
    </p>
  );
}
