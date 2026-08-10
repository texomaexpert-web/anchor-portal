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
          <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg border border-hairline-strong bg-raised text-lg font-semibold text-accent">
            A
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            Anchor Portal
          </h1>
          <p className="mt-1.5 text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            American Dream Realty · staff sign in
          </p>
        </div>

        <div className="rounded-lg border border-hairline bg-panel p-6">
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-ink-faint">
          Trouble signing in? Ask your broker.
        </p>
      </div>
    </main>
  );
}
