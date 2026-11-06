"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"

/** El CRM no declara un tema oscuro (ver tokens.css, decisión 2). */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      duration={4500}
      visibleToasts={3}
      offset={{ top: 72, right: 24 }}
      mobileOffset={{ top: 64, left: 16, right: 16 }}
      containerAriaLabel="Avisos del CRM"
      className="toaster group"
      toastOptions={{
        className: "qh-toast",
        closeButtonAriaLabel: "Cerrar aviso",
        style: { paddingRight: 44 },
        // Sonner injects unlayered CSS. Explicit utility priority keeps touch
        // targets and semantic tones consistent with the layered CRM styles.
        classNames: {
          closeButton: "left-auto! right-0! top-0! size-11! transform-none! rounded-lg! border-0! bg-transparent! text-inherit! hover:bg-black/5!",
          actionButton: "min-h-11! h-auto! px-3!",
          success: "bg-success-bg! text-success! border-success/30!",
          error: "bg-danger-bg! text-danger! border-danger/30!",
          warning: "bg-warning-bg! text-warning! border-warning/30!",
          info: "bg-info-bg! text-info! border-info/30!",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
