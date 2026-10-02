import Link from "next/link";
import { getSessionAgent } from "@/lib/auth";
import { listLeads, listStaff, type LeadFilters } from "@/lib/data/leads";
import type { LeadStatus } from "@/lib/supabase/database.types";
import { DEAD, STATUS_LABELS, STATUS_LADDERS, statusLabel } from "@/lib/leads/status";
import { formatDate } from "@/lib/time";
import { SideBadge, StatusBadge, leadName } from "@/components/leads/badges";
import { fieldClass } from "@/components/ui/form";

export const metadata = { title: "Leads" };
export const dynamic = "force-dynamic";

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v || undefined;
}

// Every status on either ladder, plus Dead, de-duplicated in ladder order.
const ALL_STATUSES: LeadStatus[] = [
  ...new Set<LeadStatus>([...STATUS_LADDERS.seller, ...STATUS_LADDERS.buyer, DEAD]),
];

export default async function LeadsPage(props: PageProps<"/leads">) {
  const { agent } = await getSessionAgent();
  if (!agent) return null;
  const isBroker = agent.role === "broker";

  const sp = await props.searchParams;
  const side = one(sp.side);
  const status = one(sp.status);
  const filters: LeadFilters = {
    side: side === "buyer" || side === "seller" ? side : undefined,
    status: status && status in STATUS_LABELS ? (status as LeadStatus) : undefined,
    agent: isBroker ? one(sp.agent) : undefined,
    deadRequested: isBroker && one(sp.dead) === "requested",
  };

  const [leads, staff] = await Promise.all([listLeads(filters), listStaff()]);
  const nameById = new Map(staff.map((s) => [s.id, s.name]));
  const filtered = Boolean(filters.side || filters.status || filters.agent || filters.deadRequested);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
            {isBroker ? "Every lead · broker view" : "Your leads"}
          </p>
          <h1 className="mt-1.5 text-xl font-semibold tracking-tight text-ink">Leads</h1>
        </div>
        <Link
          href="/leads/new"
          className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-bg hover:bg-accent/90"
        >
          Add lead
        </Link>
      </header>

      <form className="mb-4 flex flex-wrap items-center gap-2">
        <select name="side" defaultValue={filters.side ?? ""} className={`${fieldClass} w-auto`} aria-label="Type">
          <option value="">All types</option>
          <option value="buyer">Buyers</option>
          <option value="seller">Sellers</option>
        </select>
        <select name="status" defaultValue={filters.status ?? ""} className={`${fieldClass} w-auto`} aria-label="Status">
          <option value="">Any status</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
        {isBroker && (
          <>
            <select name="agent" defaultValue={filters.agent ?? ""} className={`${fieldClass} w-auto`} aria-label="Agent">
              <option value="">All agents</option>
              <option value="unassigned">Unassigned</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select name="dead" defaultValue={filters.deadRequested ? "requested" : ""} className={`${fieldClass} w-auto`} aria-label="Dead requests">
              <option value="">Any</option>
              <option value="requested">Dead requested</option>
            </select>
          </>
        )}
        <button
          type="submit"
          className="rounded-lg border border-hairline-strong bg-raised px-3 py-2 text-sm font-medium text-ink-muted hover:text-ink"
        >
          Filter
        </button>
        {filtered && (
          <Link href="/leads" className="px-2 text-sm text-ink-faint hover:text-ink-muted">
            Clear
          </Link>
        )}
      </form>

      <section className="rounded-lg border border-hairline bg-panel">
        {leads.length === 0 ? (
          <p className="px-4 py-6 text-sm text-ink-muted">
            {filtered ? "No leads match those filters." : "No leads yet. Add one to get started."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[56rem] text-left text-sm">
              <thead>
                <tr className="border-b border-hairline text-[10px] uppercase tracking-[0.08em] text-ink-faint">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Agent</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-raised/50">
                    <td className="px-4 py-3">
                      <Link href={`/leads/${lead.id}`} className="font-medium text-ink hover:text-accent">
                        {leadName(lead)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      <div className="font-mono text-xs tabular-nums">{lead.phone ?? "—"}</div>
                      <div className="text-xs">{lead.email ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">
                      <SideBadge side={lead.side} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge lead={lead} />
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{lead.source ?? "—"}</td>
                    <td className="px-4 py-3">
                      {lead.agent_id ? (
                        <span className="text-ink-muted">{nameById.get(lead.agent_id) ?? "—"}</span>
                      ) : (
                        <span className="text-aging">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-ink-faint">
                      {formatDate(lead.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="mt-3 font-mono text-[10px] tabular-nums text-ink-faint">
        {leads.length} lead{leads.length === 1 ? "" : "s"}
      </p>
    </div>
  );
}
