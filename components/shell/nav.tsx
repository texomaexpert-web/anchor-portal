"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="1.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1.5" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function InspectorIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M8 1.5 13.5 3.5v4c0 3.2-2.3 5.7-5.5 7-3.2-1.3-5.5-3.8-5.5-7v-4L8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="m5.8 8 1.6 1.6L10.6 6.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StudioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      <path
        d="M9.5 2.5 13.5 6.5 6 14H2v-4l7.5-7.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="m7.8 4.2 4 4" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

const tools = [
  { name: "Agent Dashboard", href: "/", enabled: true, Icon: DashboardIcon },
  { name: "Inspector", href: null, enabled: false, Icon: InspectorIcon },
  { name: "Studio", href: null, enabled: false, Icon: StudioIcon },
] as const;

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-row gap-1 lg:flex-col">
      {tools.map((tool) =>
        tool.enabled ? (
          <Link
            key={tool.name}
            href={tool.href}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === tool.href
                ? "bg-raised text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                : "text-ink-muted hover:bg-raised/60 hover:text-ink"
            }`}
          >
            <tool.Icon
              className={`h-4 w-4 shrink-0 ${
                pathname === tool.href ? "text-accent" : "text-ink-faint"
              }`}
            />
            {tool.name}
          </Link>
        ) : (
          <span
            key={tool.name}
            aria-disabled="true"
            className="flex cursor-default items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-faint"
          >
            <tool.Icon className="h-4 w-4 shrink-0 text-ink-faint/70" />
            {tool.name}
            <span className="ml-auto rounded-[4px] border border-hairline-strong px-1.5 py-px font-mono text-[10px] uppercase tracking-[0.08em] text-ink-faint">
              Soon
            </span>
          </span>
        ),
      )}
    </nav>
  );
}
