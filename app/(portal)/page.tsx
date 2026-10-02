import Link from "next/link";
import { getSessionAgent } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatDayDate, formatDateTime } from "@/lib/time";
import { NewLeads } from "@/components/dashboard/new-leads";
import { PendingTasks } from "@/components/dashboard/pending-tasks";
import { TodayAppointments } from "@/components/dashboard/today-appointments";
import { IntakePool } from "@/components/dashboard/intake-pool";

// Always render from live data — this is a morning cockpit, not a brochure.
export const dynamic = "force-dynamic";

function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

type Tab = "new" | "tasks";

function TabLink({
  tab,
  active,
  label,
  count,
}: {
  tab: Tab;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={`/?tab=${tab}`}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2 border-b-2 px-1 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
        active
          ? "border-accent text-ink"
          : "border-transparent text-ink-faint hover:text-ink-muted"
      }`}
    >
      {label}
      <span
        className={`rounded-[4px] px-1.5 py-px font-mono text-[10px] tabular-nums ${
          count > 0 ? "bg-accent/15 text-accent" : "bg-raised text-ink-faint"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

export default async function DashboardPage(props: PageProps<"/">) {
  const { agent } = await getSessionAgent();
  if (!agent) return null; // layout renders the no-agent-record screen

  const isBroker = agent.role === "broker";
  const data = await getDashboardData(agent);
  const firstName = agent.name.split(" ")[0];

  // Phase Two: New Leads is the default surface; with none, the dashboard
  // falls back to Pending Tasks. An explicit ?tab= wins.
  const { tab: tabParam } = await props.searchParams;
  const tab: Tab =
    tabParam === "new" || tabParam === "tasks"
      ? tabParam
      : data.newLeads.length > 0
        ? "new"
        : "tasks";

  const n = data.newLeads.length;
  const t = data.pendingTasks.length;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            {formatDayDate()}
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {n > 0
              ? `${n} new lead${n === 1 ? "" : "s"} since you last logged in.`
              : t > 0
                ? `No new leads. ${t} task${t === 1 ? "" : "s"} waiting on you.`
                : "No new leads, no pending tasks."}
          </p>
        </div>
        <Link
          href="/leads/new"
          className="rounded-lg border border-hairline-strong bg-raised px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink"
        >
          Add lead
        </Link>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="flex flex-col gap-5 lg:col-span-3">
          <section className="rounded-lg border border-hairline bg-panel">
            <nav className="flex gap-5 border-b border-hairline px-4 pt-3">
              <TabLink tab="new" active={tab === "new"} label="New leads" count={n} />
              <TabLink tab="tasks" active={tab === "tasks"} label="Pending tasks" count={t} />
            </nav>
            <div className="px-4 py-3.5">
              {tab === "new" ? (
                <>
                  <NewLeads
                    items={data.newLeads}
                    agentNameById={isBroker ? data.agentNameById : undefined}
                  />
                  {data.newSince && (
                    <p className="mt-3 font-mono text-[10px] tabular-nums text-ink-faint">
                      since {formatDateTime(data.newSince)}
                    </p>
                  )}
                </>
              ) : (
                <PendingTasks items={data.pendingTasks} />
              )}
            </div>
          </section>
          {isBroker && <IntakePool items={data.intakePool} />}
        </div>
        <div className="flex flex-col gap-5 lg:col-span-2">
          <TodayAppointments
            items={data.todayAppointments}
            showAgent={isBroker}
          />
        </div>
      </div>
    </div>
  );
}
