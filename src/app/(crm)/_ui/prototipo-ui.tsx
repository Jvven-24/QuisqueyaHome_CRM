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
  eyebrow: string;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line/60 pb-6 mb-8">
      <div>
        <p className="eyebrow inline-flex items-center gap-1.5 font-bold tracking-[0.14em] text-[11px] text-gold-700 uppercase bg-gold-100/70 px-2.5 py-0.5 rounded-full border border-gold-600/20 mb-2">
          {eyebrow}
        </p>
        <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-navy-950 tracking-tight leading-none mb-1.5">
          {title}
        </h1>
        <p className="text-sm md:text-base text-ink-muted leading-relaxed max-w-2xl">
          {subtitle}
        </p>
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
          ? "avatar avatar-small inline-flex items-center justify-center size-8 rounded-full bg-navy-900 border border-gold-500/40 text-white font-heading font-bold text-xs shrink-0 shadow-sm"
          : "avatar inline-flex items-center justify-center size-10 rounded-full bg-navy-900 border-2 border-gold-500/50 text-white font-heading font-bold text-sm shrink-0 shadow-sm"
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
    <div className="metric bg-surface border border-line/80 rounded-xl p-5 shadow-xs hover:border-gold-600/40 transition-all duration-200 group">
      <span className="text-xs uppercase tracking-wider font-semibold text-ink-muted group-hover:text-gold-700 transition-colors">
        {label}
      </span>
      <strong className="block font-heading font-black text-2xl md:text-3xl text-navy-950 mt-1 mb-1 tracking-tight">
        {value}
      </strong>
      <small className="text-xs text-ink-muted/90 flex items-center gap-1 font-medium">
        {note}
      </small>
    </div>
  );
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal bg-surface border border-line rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="drawer-head flex items-center justify-between px-6 py-4 border-b border-line bg-surface-alt">
          <h2 id="modal-title" className="font-heading font-bold text-lg text-navy-950 m-0">
            {title}
          </h2>
          <button
            type="button"
            className="icon-button flex items-center justify-center size-8 rounded-lg text-ink-muted hover:text-navy-950 hover:bg-navy-100 transition-colors"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </section>
    </div>
  );
}

