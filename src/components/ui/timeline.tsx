import * as React from "react";
import { cn } from "@/lib/utils";

const Timeline = React.forwardRef<
  HTMLOListElement,
  React.OlHTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    data-slot="timeline"
    className={cn("relative m-0 list-none space-y-6 p-0", className)}
    {...props}
  />
));
Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    data-slot="timeline-item"
    className={cn("relative flex gap-4 pl-0", className)}
    {...props}
  />
));
TimelineItem.displayName = "TimelineItem";

const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="timeline-connector"
    aria-hidden="true"
    className={cn(
      "absolute left-4 top-8 -bottom-6 w-0.5 bg-line",
      className
    )}
    {...props}
  />
));
TimelineConnector.displayName = "TimelineConnector";

const TimelineIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="timeline-icon"
    className={cn(
      "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-muted shadow-sm",
      className
    )}
    {...props}
  />
));
TimelineIcon.displayName = "TimelineIcon";

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="timeline-content"
    className={cn("flex flex-1 flex-col gap-1 pt-0.5", className)}
    {...props}
  />
));
TimelineContent.displayName = "TimelineContent";

const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="timeline-header"
    className={cn("flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5", className)}
    {...props}
  />
));
TimelineHeader.displayName = "TimelineHeader";

const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h4
    ref={ref}
    data-slot="timeline-title"
    className={cn("m-0 text-sm font-semibold text-ink", className)}
    {...props}
  />
));
TimelineTitle.displayName = "TimelineTitle";

const TimelineTime = React.forwardRef<
  HTMLTimeElement,
  React.TimeHTMLAttributes<HTMLTimeElement>
>(({ className, ...props }, ref) => (
  <time
    ref={ref}
    data-slot="timeline-time"
    className={cn("text-[13px] text-ink-muted", className)}
    {...props}
  />
));
TimelineTime.displayName = "TimelineTime";

const TimelineBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="timeline-body"
    className={cn("text-sm text-ink-muted", className)}
    {...props}
  />
));
TimelineBody.displayName = "TimelineBody";

export {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineIcon,
  TimelineContent,
  TimelineHeader,
  TimelineTitle,
  TimelineTime,
  TimelineBody,
};
