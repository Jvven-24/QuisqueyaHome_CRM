import type { ReactNode } from "react";

export function Section({ title, actions, children, className = "" }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-5 ${className}`}>
    {(title || actions) && <header className="mb-3 flex flex-wrap items-center justify-between gap-3">{title && <h2 className="m-0 font-heading text-base font-bold text-navy-900">{title}</h2>}{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}</header>}
    {children}
  </section>;
}
