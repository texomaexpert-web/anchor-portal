import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-lg font-semibold text-white">
            A
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Anchor Portal
          </h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            American Dream Realty · staff sign in
          </p>
        </div>

        <div className="rounded-xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(29,26,22,0.04)]">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-ink-faint">
          Trouble signing in? Ask your broker.
        </p>
      </div>
    </main>
  );
}
