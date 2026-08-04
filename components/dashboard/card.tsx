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
    <section className="rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(29,26,22,0.04)]">
      <header className="flex items-baseline justify-between border-b border-line px-5 py-3.5">
        <h2 className="text-sm font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {meta && <span className="text-xs text-ink-faint">{meta}</span>}
      </header>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

export function EmptyLine({ children }: { children: React.ReactNode }) {
  return <p className="py-1 text-[15px] text-ink-muted">{children}</p>;
}
