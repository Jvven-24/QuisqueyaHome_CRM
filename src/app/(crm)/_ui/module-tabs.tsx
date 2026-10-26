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
      <div className={`w-full border-b border-border overflow-x-auto no-scrollbar ${className}`}>
        <div className="flex items-center gap-5 min-w-max px-1">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex items-center gap-2 py-2.5 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "text-navy-950 font-bold"
                    : "text-muted-foreground hover:text-navy-900"
                }`}
              >
                {Icon && <Icon className={`size-4 ${isActive ? "text-gold-700" : "text-muted-foreground"}`} />}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono rounded-full font-bold tabular-nums ${
                      isActive
                        ? "bg-gold-100 text-gold-800 border border-gold-600/30"
                        : "bg-surface-alt text-muted-foreground border border-border"
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
    <div className={`w-full overflow-x-auto no-scrollbar py-0.5 ${className}`}>
      <div className="inline-flex items-center gap-1 p-0.5 bg-surface-alt border border-border rounded-lg min-w-max shadow-none">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-surface text-navy-950 shadow-none border border-border font-bold"
                  : "text-muted-foreground hover:text-navy-900 hover:bg-surface/50"
              }`}
            >
              {Icon && <Icon className={`size-3.5 ${isActive ? "text-gold-700" : "text-muted-foreground"}`} />}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-mono rounded-full font-bold tabular-nums ${
                    isActive
                      ? "bg-gold-100 text-gold-800"
                      : "bg-surface text-muted-foreground border border-border/50"
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
