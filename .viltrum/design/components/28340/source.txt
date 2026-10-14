import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Marker, MarkerContent } from "@/components/ui/timeline-3-utils/marker";
import { IconPlaceholder } from "@/components/ui/timeline-3-utils/icon-placeholder";
import type * as React from "react";

/** Props a call site may pass through to an icon. */
type IconProps = { className?: string; size?: number | string };

/** An icon held in data and rendered later, e.g. `<item.icon className="size-4" />`. */
type IconRenderer = (props: IconProps) => React.ReactNode;

type Event = {
  actor: string;
  initials: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  icon: IconRenderer;
};

const groups: { label: string; events: Event[] }[] = [
  {
    label: "Today",
    events: [
      {
        actor: "Mara Ellis",
        initials: "ME",
        avatar: "https://cdn.21st.dev/assets/mirror/93/93a1ee3f10b9da51ac1432f03a0680fa3016b4a2eb6659aef46c25df091ab930.jpg",
        action: "merged pull request",
        target: "feat/auth-refresh",
        time: "12 Min Ago",
        icon: (p: IconProps) => (
          <IconPlaceholder
            lucide="GitMerge"
            tabler="IconGitMerge"
            hugeicons="GitMergeIcon"
            phosphor="GitMerge"
            remixicon="RiGitMergeLine"
            {...p}
          />
        ),
      },
      {
        actor: "Leo Tanaka",
        initials: "LT",
        avatar: "https://cdn.21st.dev/assets/mirror/51/511e8a28ad384d1692e249771c5da88414ce778aec74ea21451d519db92e0038.jpg",
        action: "deployed to production",
        target: "v2.4.1",
        time: "1 Hour Ago",
        icon: (p: IconProps) => (
          <IconPlaceholder
            lucide="Upload"
            tabler="IconUpload"
            hugeicons="UploadIcon"
            phosphor="Upload"
            remixicon="RiUploadLine"
            {...p}
          />
        ),
      },
      {
        actor: "Priya Nair",
        initials: "PN",
        avatar: "https://cdn.21st.dev/assets/mirror/ff/ff69e06d986306dd387813d2e4f8afda62c6ee5f9fbc7bb83dc69b323b9d3869.jpg",
        action: "resolved a comment on",
        target: "Q3 Roadmap",
        time: "3 Hours Ago",
        icon: (p: IconProps) => (
          <IconPlaceholder
            lucide="MessageCircle"
            tabler="IconMessageCircle"
            hugeicons="Message01Icon"
            phosphor="ChatCircle"
            remixicon="RiChat3Line"
            {...p}
          />
        ),
      },
    ],
  },
  {
    label: "Yesterday",
    events: [
      {
        actor: "Sasha Kim",
        initials: "SK",
        avatar: "https://cdn.21st.dev/assets/mirror/a4/a4f796780e78d2c6c13f57c2f81a3fa8c26c8fcdbfdbfe2c32cdbe4dc3d940e2.jpg",
        action: "completed task",
        target: "Migrate billing service",
        time: "Jun 24",
        icon: (p: IconProps) => (
          <IconPlaceholder
            lucide="Check"
            tabler="IconCheck"
            hugeicons="Tick02Icon"
            phosphor="Check"
            remixicon="RiCheckLine"
            {...p}
          />
        ),
      },
      {
        actor: "Owen Brooks",
        initials: "OB",
        avatar: "https://cdn.21st.dev/assets/mirror/2b/2b7b08655f93dbb0d950da430b1e251dcfede184e47d81a2c425514cd529b0fe.jpg",
        action: "invited a new member",
        target: "design@acme.com",
        time: "Jun 24",
        icon: (p: IconProps) => (
          <IconPlaceholder
            lucide="UserPlus"
            tabler="IconUserPlus"
            hugeicons="UserAddIcon"
            phosphor="UserPlus"
            remixicon="RiUserAddLine"
            {...p}
          />
        ),
      },
    ],
  },
];

export default function TimelineBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight">
              Activity
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              What your team has been working on lately.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            5 Updates
          </Badge>
        </div>

        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-4">
              <Marker variant="separator">
                <MarkerContent>{group.label}</MarkerContent>
              </Marker>

              <ol className="relative flex flex-col gap-5">
                <span
                  className="absolute top-3 bottom-3 left-4 w-px bg-border"
                  aria-hidden="true"
                />
                {group.events.map((event) => (
                  <li
                    key={`${event.actor}-${event.target}`}
                    className="relative flex items-center gap-3"
                  >
                    <span className="relative shrink-0">
                      <Avatar className="size-9 border border-border">
                        <AvatarImage
                          src={event.avatar}
                          alt={event.actor}
                          className="grayscale"
                        />
                        <AvatarFallback>{event.initials}</AvatarFallback>
                      </Avatar>
                      <span className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border border-border bg-card text-muted-foreground">
                        <event.icon className="size-2.5" aria-hidden="true" />
                      </span>
                    </span>

                    <p className="flex-1 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {event.actor}
                      </span>{" "}
                      {event.action}{" "}
                      <span className="font-medium text-foreground">
                        {event.target}
                      </span>
                    </p>

                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {event.time}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
