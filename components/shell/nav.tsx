"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tools = [
  { name: "Agent Dashboard", href: "/", enabled: true },
  { name: "Inspector", href: null, enabled: false },
  { name: "Studio", href: null, enabled: false },
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
            className={`flex items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === tool.href
                ? "bg-accent-soft text-accent-deep"
                : "text-ink-muted hover:bg-line/50 hover:text-ink"
            }`}
          >
            {tool.name}
          </Link>
        ) : (
          <span
            key={tool.name}
            aria-disabled="true"
            className="flex cursor-default items-center justify-between gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-ink-faint"
          >
            {tool.name}
            <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
              Soon
            </span>
          </span>
        ),
      )}
    </nav>
  );
}
