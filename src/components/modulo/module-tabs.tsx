"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ModuleTabItem { href: string; label: string; match?: "exact" | "prefix" }

export function ModuleTabs({ items, label, className = "" }: { items: readonly ModuleTabItem[]; label: string; className?: string }) {
  const pathname = usePathname();
  return <nav aria-label={label} className={`-mx-1 min-w-0 overflow-x-auto px-1 ${className}`}>
    <div className="flex w-max min-w-full items-center gap-1 border-b border-line">
      {items.map(item => {
        const targetPath = new URL(item.href, "http://crm.local").pathname;
        const active = pathname === targetPath || (item.match === "prefix" && pathname.startsWith(`${targetPath}/`));
        return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-[13px] font-semibold focus-visible:outline-2 focus-visible:outline-gold-700 ${active ? "border-gold-600 text-navy-900" : "border-transparent text-ink-muted hover:text-navy-900"}`}>{item.label}</Link>;
      })}
    </div>
  </nav>;
}
