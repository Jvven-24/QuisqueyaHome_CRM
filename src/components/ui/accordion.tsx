"use client"

import * as React from "react"
import { Accordion as AccordionPrimitive } from "radix-ui"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("border-b border-line", className)} {...props} />
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn("group flex min-h-12 flex-1 items-center justify-between gap-3 rounded-md py-3 text-left font-semibold text-navy-900 outline-none transition-colors duration-150 hover:text-gold-700 focus-visible:ring-2 focus-visible:ring-gold-700 focus-visible:ring-offset-2 dark:text-foreground dark:hover:text-gold-600 motion-reduce:transition-none", className)}
        {...props}
      >
        {children}<ChevronDown aria-hidden="true" className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="overflow-hidden text-sm data-[state=closed]:animate-[accordion-up_180ms_ease-in] data-[state=open]:animate-[accordion-down_200ms_ease-out] motion-reduce:animate-none"
      {...props}
    >
      <div className={cn("pb-4 pt-1", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
