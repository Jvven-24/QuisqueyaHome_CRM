"use client";

import React from "react";

export interface TabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: "neutral" | "gold" | "green" | "red" | "blue";
}

interface ModuleTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: "pills" | "underline";
}

export function ModuleTabs({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  variant = "pills",
}: ModuleTabsProps) {
  if (variant === "underline") {
    return (
      <div className={`w-full border-b border-line overflow-x-auto no-scrollbar ${className}`}>
        <div className="flex items-center gap-6 min-w-max px-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 py-3.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "text-navy-950 font-bold"
                    : "text-ink-muted hover:text-navy-900"
                }`}
              >
                {Icon && <Icon className={`size-4 ${isActive ? "text-gold-700" : "text-ink-muted"}`} />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[11px] font-mono rounded-full font-bold tabular-nums ${
                      isActive
                        ? "bg-gold-100 text-gold-800 border border-gold-600/30"
                        : "bg-surface-alt text-ink-muted border border-line"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // "pills" style (segmented controls)
  return (
    <div className={`w-full overflow-x-auto no-scrollbar py-1 ${className}`}>
      <div className="inline-flex items-center gap-1.5 p-1 bg-surface-alt border border-line rounded-xl min-w-max shadow-2xs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? "bg-surface text-navy-950 shadow-xs border border-line/80 font-bold"
                  : "text-ink-muted hover:text-navy-900 hover:bg-surface/50"
              }`}
            >
              {Icon && <Icon className={`size-3.5 ${isActive ? "text-gold-700" : "text-ink-muted"}`} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono rounded-full font-bold tabular-nums ${
                    isActive
                      ? "bg-gold-100 text-gold-800"
                      : "bg-surface text-ink-muted border border-line/50"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
