import { getSessionAgent } from "@/lib/auth";
import { Nav } from "@/components/shell/nav";
import { SignOutButton } from "@/components/shell/signout-button";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-hairline-strong bg-raised text-sm font-semibold text-accent">
        A
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight text-ink">
          Anchor
        </div>
        <div className="text-[10px] uppercase tracking-[0.08em] text-ink-faint">
          American Dream Realty
        </div>
      </div>
    </div>
  );
}

export default async function PortalLayout({ children }: LayoutProps<"/">) {
  const { email, agent } = await getSessionAgent();

  if (!agent) {
    return (
      <main className="flex min-h-screen flex-1 items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-hairline bg-panel p-8 text-center">
          <h1 className="text-base font-semibold text-ink">
            No agent record found
          </h1>
          <p className="mt-2 text-sm text-ink-muted">
            You&apos;re signed in as <span className="font-medium">{email}</span>,
            but there&apos;s no matching row in the agent table. Ask your broker
            to add you, then sign in again.
          </p>
          <div className="mt-6 flex justify-center">
            <SignOutButton />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-10 border-b border-hairline bg-sidebar/80 backdrop-blur-md lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
          <SignOutButton />
        </div>
        <div className="overflow-x-auto px-2 pb-2">
          <Nav />
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-hairline bg-sidebar lg:flex">
        <div className="sticky top-0 flex h-screen flex-col px-4 py-6">
          <Brand />
          <div className="mt-8 flex-1">
            <div className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.08em] text-ink-faint">
              Tools
            </div>
            <Nav />
          </div>
          <div className="border-t border-hairline pt-4">
            <div className="px-3 pb-2 leading-tight">
              <div className="text-sm font-medium text-ink">{agent.name}</div>
              <div className="text-[10px] uppercase tracking-[0.08em] text-ink-faint">
                {agent.role}
              </div>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
