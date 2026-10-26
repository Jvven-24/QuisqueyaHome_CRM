"use client";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AnalyticsTabs({ tabs, label }: { tabs: readonly { id: string; label: string }[]; label: string }) {
  return <div className="analytics-tabs-scroll"><TabsList aria-label={label} className="analytics-tabs">
    {tabs.map(tab => <TabsTrigger key={tab.id} value={tab.id} className="analytics-tab">{tab.label}</TabsTrigger>)}
  </TabsList></div>;
}
