import Link from "next/link";
import type { ReactNode } from "react";

export interface BreadcrumbItem { label: string; href?: string }

/**
 * Encabezado compartido de módulo.
 *
 * Móvil (390px): título compacto, sin eyebrow ni descripción (ocupan media
 * pantalla y no aportan en campo) y acciones en una cuadrícula de dos columnas
 * con objetivos táctiles de 44px, también cuando la vista las envuelve en un
 * único <div>; la última acción impar ocupa la fila completa. Escritorio: eyebrow y descripción visibles.
 */
export function PageHeader({ title, description, actions, breadcrumbs, eyebrow }: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: readonly BreadcrumbItem[];
  eyebrow?: string;
}) {
  return <header className="page-header mb-4 flex min-h-11 flex-col gap-3 border-b border-line pb-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
    <div className="min-w-0 sm:min-w-[min(100%,22rem)] sm:flex-1">
      {breadcrumbs?.length ? <nav aria-label="Ruta de navegación" className="mb-1 flex flex-wrap items-center gap-2 text-[13px] text-ink-muted sm:mb-2 sm:text-sm">{breadcrumbs.map((item, index) => <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">{index > 0 && <span aria-hidden="true">/</span>}{item.href ? <Link href={item.href} className="underline-offset-2 hover:underline">{item.label}</Link> : <span aria-current="page">{item.label}</span>}</span>)}</nav> : null}
      {eyebrow && <p className="m-0 mb-1 hidden text-[13px] font-semibold uppercase tracking-wide text-[var(--ink-secondary)] sm:block">{eyebrow}</p>}
      <h1 className="m-0 font-heading text-lg font-bold leading-tight tracking-tight text-navy-900 sm:text-2xl">{title}</h1>
      {description && <p className="m-0 mt-1 hidden max-w-3xl text-sm text-ink-muted sm:block">{description}</p>}
    </div>
    {actions && <div className="page-header-actions grid w-full shrink-0 grid-cols-2 items-center gap-2 [&>*]:min-h-11 [&>*]:w-full [&>*]:justify-center-safe [&>:only-child]:col-span-2 [&>div:only-child]:grid [&>div:only-child]:grid-cols-2 [&>div:only-child]:gap-2 [&>div:only-child>*]:min-h-11 [&>div:only-child>*]:w-full [&>div:only-child>*]:justify-center-safe [&>div:only-child>*:nth-child(odd):last-child]:col-span-2 sm:flex sm:w-auto sm:flex-wrap sm:[&>*]:w-auto sm:[&>div:only-child]:flex sm:[&>div:only-child>*]:w-auto">{actions}</div>}
  </header>;
}
