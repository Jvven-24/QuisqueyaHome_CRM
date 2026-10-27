"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group inline-flex size-11 shrink-0 items-center justify-center rounded-full outline-none transition-colors duration-150",
        "focus-visible:ring-2 focus-visible:ring-gold-700 focus-visible:ring-offset-2 focus-visible:ring-offset-surface",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="flex h-[18px] w-8 items-center rounded-full border-2 border-navy-700 bg-surface px-0.5 transition-colors group-hover:border-gold-700 group-data-[state=checked]:border-navy-900 group-data-[state=checked]:bg-navy-900">
        <SwitchPrimitive.Thumb className="block size-3 rounded-full bg-navy-700 transition-transform duration-150 group-data-[state=checked]:translate-x-[14px] group-data-[state=checked]:bg-white" />
      </span>
    </SwitchPrimitive.Root>
  );
}

export { Switch };
