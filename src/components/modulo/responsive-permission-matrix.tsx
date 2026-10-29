"use client";

import type { ReactNode } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { agruparRecursosPorModulo } from "./permission-matrix";

export function ResponsivePermissionMatrix({
  resources,
  actions,
  resourceLabels,
  actionLabels,
  renderCell,
}: {
  resources: readonly string[];
  actions: readonly string[];
  resourceLabels: Readonly<Record<string, string>>;
  actionLabels: Readonly<Record<string, string>>;
  renderCell: (resource: string, action: string) => ReactNode;
}) {
  const groups = agruparRecursosPorModulo(resources);

  if (groups.length === 0) {
    return <p role="status" className="rounded-lg border border-line bg-surface p-4 text-sm text-[var(--ink-secondary)]">
      No hay recursos que coincidan con la búsqueda.
    </p>;
  }

  return (
    <Accordion type="multiple" defaultValue={[groups[0]!.id]} className="space-y-3">
      {groups.map((group) => (
        <AccordionItem key={group.id} value={group.id} className="overflow-hidden rounded-xl border border-line bg-surface px-4 sm:px-5">
          <AccordionTrigger className="text-[15px] text-navy-950 dark:text-foreground">
            <span className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-3 gap-y-1 pr-2">
              <span>{group.label}</span>
              <span className="text-[13px] font-normal text-[var(--ink-secondary)]">{group.resources.length} {group.resources.length === 1 ? "recurso" : "recursos"}</span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            {group.resources.map((resource) => (
              <section key={resource} aria-label={resourceLabels[resource] ?? resource} className="min-w-0 rounded-lg border border-line bg-canvas p-3 sm:p-4">
                <h3 className="mb-3 break-words text-sm font-semibold text-navy-950 dark:text-foreground">
                  {resourceLabels[resource] ?? resource}
                  <span className="ml-2 break-all font-mono text-[12px] font-normal text-[var(--ink-secondary)]">{resource}</span>
                </h3>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {actions.map((action) => (
                    <div key={action} className="min-w-0 space-y-1">
                      <div className="text-[13px] font-medium text-ink">{actionLabels[action] ?? action}</div>
                      {renderCell(resource, action)}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
