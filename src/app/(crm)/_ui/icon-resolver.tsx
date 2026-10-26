"use client";

import React from "react";
import {
  LayoutDashboard,
  UserPlus,
  Users,
  Kanban,
  Calendar,
  CheckSquare,
  Building2,
  HardHat,
  Briefcase,
  Target,
  BadgeDollarSign,
  GraduationCap,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  type LucideProps,
} from "lucide-react";

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  LayoutDashboard,
  UserPlus,
  Users,
  Kanban,
  Calendar,
  CheckSquare,
  Building2,
  HardHat,
  Briefcase,
  Target,
  BadgeDollarSign,
  GraduationCap,
  MessageSquare,
  BarChart3,
  Settings,
};

export function ModuloIcon({
  name,
  className = "size-4",
  ...props
}: { name: string; className?: string } & LucideProps) {
  const IconComponent = ICON_MAP[name] ?? HelpCircle;
  return <IconComponent className={className} {...props} />;
}
