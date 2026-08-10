export function Card({
  title,
  meta,
  children,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-hairline bg-panel">
      <header className="flex items-baseline justify-between border-b border-hairline px-4 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
          {title}
        </h2>
        {meta && (
          <span className="font-mono text-[10px] tabular-nums text-ink-faint">
            {meta}
          </span>
        )}
      </header>
      <div className="px-4 py-3.5">{children}</div>
    </section>
  );
}

export function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="py-1 text-sm text-ink-muted">{children}</p>;
}
