import Link from "next/link";
import type { ReactNode } from "react";

export interface BreadcrumbItem { label: string; href?: string }

export function PageHeader({ title, description, actions, breadcrumbs, eyebrow }: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: readonly BreadcrumbItem[];
  eyebrow?: string;
}) {
  return <header className="page-header mb-4 flex min-h-11 flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
    <div className="min-w-0 sm:min-w-[min(100%,22rem)] sm:flex-1">
      {breadcrumbs?.length ? <nav aria-label="Ruta de navegación" className="mb-2 flex flex-wrap items-center gap-2 text-sm text-ink-muted">{breadcrumbs.map((item, index) => <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href} className="underline-offset-2 hover:underline">{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}</nav> : null}
      {eyebrow && <p className="m-0 mb-1 text-sm font-semibold uppercase tracking-wide text-[var(--ink-secondary)]">{eyebrow}</p>}
      <h1 className="m-0 font-heading text-xl font-bold tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
      {description && <p className="m-0 mt-1 max-w-3xl text-sm text-ink-muted">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </header>;
}
