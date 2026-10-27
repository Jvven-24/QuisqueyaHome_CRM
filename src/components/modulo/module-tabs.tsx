"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { KeyboardEvent } from "react";

export interface ModuleTabItem { href: string; label: string; match?: "exact" | "prefix"; value?: string }

export function ModuleTabs({ items, label, className = "", queryParam, activeTab, panelId }: { items: readonly ModuleTabItem[]; label: string; className?: string; queryParam?: string; activeTab?: string; panelId?: string }) {
  const pathname = usePathname();
  const isTabList = Boolean(queryParam);
  function onTabKeyDown(event: KeyboardEvent<HTMLAnchorElement>) {
    if (!isTabList || !["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLAnchorElement>('[role="tab"]') ?? []);
    const current = tabs.indexOf(event.currentTarget);
    const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    tabs[next]?.click();
  }
  return <nav aria-label={label} className={`-mx-1 min-w-0 overflow-x-auto px-1 ${className}`}>
    <div role={isTabList ? "tablist" : undefined} aria-orientation={isTabList ? "horizontal" : undefined} className="flex w-max min-w-full items-center gap-1 border-b border-line">
      {items.map(item => {
        const targetPath = new URL(item.href, "http://crm.local").pathname;
        const active = isTabList ? item.value === activeTab : pathname === targetPath || (item.match === "prefix" && pathname.startsWith(`${targetPath}/`));
        const href = isTabList ? (() => { const url = new URL(item.href, "http://crm.local"); url.searchParams.set(queryParam!, item.value ?? ""); return `${url.pathname}${url.search}${url.hash}`; })() : item.href;
        return <Link key={item.href + (item.value ?? "")} href={href} role={isTabList ? "tab" : undefined} id={isTabList ? `${panelId}-tab-${item.value}` : undefined} aria-controls={isTabList ? panelId : undefined} aria-selected={isTabList ? active : undefined} aria-current={!isTabList && active ? "page" : undefined} tabIndex={isTabList ? (active ? 0 : -1) : undefined} onKeyDown={isTabList ? onTabKeyDown : undefined} className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-gold-700 ${active ? "border-gold-600 text-navy-900" : "border-transparent text-ink-muted hover:text-navy-900"}`}>{item.label}</Link>;
      })}
    </div>
  </nav>;
}
