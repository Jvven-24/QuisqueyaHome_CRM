"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

/**
 * Componentes visuales compartidos de alta gama (Estándar Viltrum Design & Quisqueya Studio).
 * Reemplaza maquetación plana con jerarquía tipográfica premium, tokens semánticos e iconografía SVG.
 */

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3 mb-4 min-h-[40px]">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {eyebrow && (
            <span className="eyebrow inline-flex items-center font-bold tracking-[0.1em] text-[10px] text-gold-700 uppercase bg-gold-100/80 px-2 py-0.5 rounded border border-gold-600/20">
              {eyebrow}
            </span>
          )}
          <h1 className="font-heading font-bold text-lg md:text-xl text-navy-950 tracking-tight leading-none m-0">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground leading-normal max-w-2xl mt-1 m-0">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
    </header>
  );
}

export function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={
        small
          ? "avatar avatar-small inline-flex items-center justify-center size-7 rounded-full bg-navy-900 border border-gold-500/40 text-white font-heading font-bold text-[11px] shrink-0"
          : "avatar inline-flex items-center justify-center size-9 rounded-full bg-navy-900 border border-gold-500/50 text-white font-heading font-bold text-xs shrink-0"
      }
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

const TONE_CLASSES = {
  neutral: "bg-surface-alt text-ink-muted border-line",
  gold: "bg-gold-100 text-gold-800 border-gold-600/30 font-semibold",
  green: "bg-success-bg text-success border-success/20 font-semibold",
  red: "bg-danger-bg text-danger border-danger/20 font-semibold",
  blue: "bg-info-bg text-info border-info/20 font-semibold",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "green" | "red" | "blue";
}) {
  return (
    <span
      className={`badge inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
        TONE_CLASSES[tone] ?? TONE_CLASSES.neutral
      }`}
    >
      {children}
    </span>
  );
}

export function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="metric bg-surface border border-border rounded-lg p-3 shadow-none hover:border-gold-600/40 transition-colors duration-150 group">
      <span className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground group-hover:text-gold-700 transition-colors">
        {label}
      </span>
      <strong className="block font-heading font-bold text-xl text-navy-950 mt-0.5 mb-0.5 tracking-tight">
        {value}
      </strong>
      <small className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
        {note}
      </small>
    </div>
  );
}

import { useFocusTrap } from "@/hooks/use-focus-trap";

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const containerRef = useFocusTrap<HTMLElement>({ onClose });

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4 animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={containerRef}
        tabIndex={-1}
        className="modal bg-surface border border-border rounded-lg shadow-md max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="drawer-head flex items-center justify-between px-4 py-3 border-b border-border bg-surface-alt shrink-0">
          <h2 id="modal-title" className="font-heading font-bold text-base text-navy-950 m-0">
            {title}
          </h2>
          <button
            type="button"
            className="icon-button flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-navy-950 hover:bg-navy-100 transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">{children}</div>
      </section>
    </div>
  );
}

