"use client";

import { useId, type ReactNode } from "react";
import { analyticsCopy } from "@/app/(crm)/_ui/analitica-copy";

export type ChartState = "loading" | "empty" | "error" | "offline" | "success" | "permission";
export type ChartCardProps = {
  title: string; subtitle: string; summary?: string; state?: ChartState;
  range?: ReactNode; action?: ReactNode; emptyAction?: ReactNode;
  emptyMessage?: string; onRetry?: () => void; children?: ReactNode;
};

export function ChartCard({ title, subtitle, summary, state = "success", range, action, emptyAction, emptyMessage, onRetry, children }: ChartCardProps) {
  const id = useId();
  const c = analyticsCopy.common;
  return <section className="analytics-card" aria-labelledby={id} aria-busy={state === "loading"}>
    <header className="analytics-card-header">
      <div><h2 id={id}>{title}</h2><p>{subtitle}</p></div>
      {(range || action) && <div className="analytics-card-actions">{range}{action}</div>}
    </header>
    {state === "loading" && <div className="analytics-skeleton" role="status"><span className="sr-only">{c.loading}</span><div /><div /><div /></div>}
    {state === "empty" && <div className="analytics-state" role="status"><p>{emptyMessage ?? c.empty}</p>{emptyAction}</div>}
    {state === "error" && <div className="analytics-state" role="alert"><p>{c.error}</p>{onRetry && <button className="analytics-button" type="button" onClick={onRetry}>{c.retry}</button>}</div>}
    {state === "permission" && <div className="analytics-state" role="status"><p>{c.permission}</p></div>}
    {state === "offline" && <p className="analytics-offline" role="status">{c.offline}</p>}
    {(state === "success" || state === "offline") && <div className="analytics-card-body">{summary && <p className="sr-only">{summary}</p>}{children}</div>}
  </section>;
}
