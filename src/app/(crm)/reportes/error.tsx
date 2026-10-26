"use client";
import { ChartCard } from "@/components/ui/chart-card";
import { analyticsCopy } from "../_ui/analitica-copy";
import { useOnline } from "../_ui/analytics-state";
export default function ErrorState({ reset }: { reset: () => void }) {
  const online = useOnline();
  return <div className="analytics-page"><ChartCard title={analyticsCopy.reportes.title} subtitle={analyticsCopy.common.scope} state={online ? "error" : "offline"} onRetry={reset}>
    <button className="analytics-button" type="button" disabled={!online} onClick={reset}>{analyticsCopy.common.retry}</button>
  </ChartCard></div>;
}

