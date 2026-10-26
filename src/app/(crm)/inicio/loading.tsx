import { ChartCard } from "@/components/ui/chart-card";
import { analyticsCopy } from "../_ui/analitica-copy";
export default function Loading() { return <div className="analytics-page"><ChartCard title={analyticsCopy.inicio.title} subtitle={analyticsCopy.common.loading} state="loading" /></div>; }
