"use client"

import * as React from "react"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"
import { cn } from "@/lib/utils"

function Collapsible(props: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({ className, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Trigger>) {
  return <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" className={cn("min-h-12 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-gold-700 focus-visible:ring-offset-2", className)} {...props} />
}

function CollapsibleContent({ className, ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Content>) {
  return <CollapsiblePrimitive.Content data-slot="collapsible-content" className={cn("overflow-hidden text-sm data-[state=closed]:animate-[accordion-up_180ms_ease-in] data-[state=open]:animate-[accordion-down_200ms_ease-out] motion-reduce:animate-none", className)} {...props} />
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
