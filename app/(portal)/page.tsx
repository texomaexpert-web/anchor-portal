import { getSessionAgent } from "@/lib/auth";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatDayDate } from "@/lib/time";
import { AgingLeads } from "@/components/dashboard/aging-leads";
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

export default async function DashboardPage() {
  const { agent } = await getSessionAgent();
  if (!agent) return null; // layout renders the no-agent-record screen

  const isBroker = agent.role === "broker";
  const data = await getDashboardData(agent);
  const firstName = agent.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <header className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
          {formatDayDate()}
        </p>
        <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">
          {greeting()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {data.agingLeads.length === 0
            ? "Nothing is slipping. Here's your day."
            : `${data.agingLeads.length} lead${data.agingLeads.length === 1 ? " needs" : "s need"} attention first.`}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="flex flex-col gap-5 lg:col-span-3">
          <AgingLeads items={data.agingLeads} />
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
