"use client";

import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.ComponentProps<typeof CheckboxPrimitive.Root>, "onCheckedChange"> & {
  onCheckedChange?: (checked: boolean) => void;
};

function Checkbox({ className, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "group inline-flex size-11 shrink-0 items-center justify-center rounded-md outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-gold-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
      onCheckedChange={(value) => onCheckedChange?.(value === true)}
    >
      <span className="flex size-[17px] items-center justify-center rounded-[3px] border-2 border-navy-700 bg-surface text-surface transition-colors group-hover:border-gold-700 group-data-[state=checked]:border-navy-900 group-data-[state=checked]:bg-navy-900 group-data-[state=indeterminate]:border-navy-900 group-data-[state=indeterminate]:bg-navy-900">
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-white">
          {props.checked === "indeterminate" ? <Minus className="size-3.5" strokeWidth={3} /> : <Check className="size-3.5" strokeWidth={3} />}
        </CheckboxPrimitive.Indicator>
      </span>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
