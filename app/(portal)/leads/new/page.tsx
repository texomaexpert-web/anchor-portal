import Link from "next/link";
import { getSessionAgent } from "@/lib/auth";
import { listStaff } from "@/lib/data/leads";
import { LeadForm } from "@/components/leads/lead-form";

export const metadata = { title: "Add lead" };

export default async function NewLeadPage() {
  const { agent } = await getSessionAgent();
  if (!agent) return null;
  const isBroker = agent.role === "broker";
  const staff = isBroker ? await listStaff() : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 lg:px-10 lg:py-12">
      <Link href="/leads" className="text-xs text-ink-faint hover:text-ink-muted">
        ← Leads
      </Link>
      <h1 className="mt-3 text-xl font-semibold tracking-tight text-ink">Add lead</h1>
      <p className="mt-1 text-sm text-ink-muted">
        {isBroker
          ? "Manual entry. Leave it unassigned to drop it in the intake pool."
          : "Manual entry. It goes straight into your book."}
      </p>
      <section className="mt-6 rounded-lg border border-hairline bg-panel p-5">
        <LeadForm isBroker={isBroker} staff={staff} />
      </section>
    </div>
  );
}
