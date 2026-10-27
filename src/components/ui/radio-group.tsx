"use client";

import * as React from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-1", className)} {...props} />;
}

function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "group inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-gold-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="flex size-[17px] items-center justify-center rounded-full border-2 border-navy-700 bg-surface transition-colors group-hover:border-gold-700 group-data-[state=checked]:border-navy-900">
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <span className="size-2 rounded-full bg-navy-900" />
        </RadioGroupPrimitive.Indicator>
      </span>
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
