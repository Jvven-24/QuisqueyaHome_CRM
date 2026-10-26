"use client";
import { useSyncExternalStore } from "react";
import type { ChartState } from "@/components/ui/chart-card";

function subscribeOnline(change: () => void) {
  window.addEventListener("online", change);
  window.addEventListener("offline", change);
  return () => { window.removeEventListener("online", change); window.removeEventListener("offline", change); };
}
export function useOnline() {
  return useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
}
export function metricState(allowed: boolean, hasData: boolean, online: boolean): ChartState {
  if (!allowed) return "permission";
  if (!online) return "offline";
  return hasData ? "success" : "empty";
}
