"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ActivityType = "success" | "warning" | "info" | "default";

interface ActivityItem {
  id: string;
  title: string;
  description?: string;
  time: string;
  type?: ActivityType;
  icon?: ReactNode;
}

interface ActivityTimelineProps {
  items: ActivityItem[];
  className?: string;
}

const TYPE_COLORS: Record<ActivityType, string> = {
  success: "#22c55e",
  warning: "#f59e0b",
  info: "#3b82f6",
  default: "rgba(255,255,255,0.2)",
};

const itemVariants = {
  hidden: { opacity: 0, x: -16, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

function TimelineDot({
  type = "default",
  icon,
}: {
  type?: ActivityType;
  icon?: ReactNode;
}) {
  const color = TYPE_COLORS[type];

  if (icon) {
    return (
      <div
        className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-[var(--bg-primary,#0a0a0f)] text-sm"
        style={{ color }}
      >
        {icon}
      </div>
    );
  }

  return (
    <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.06] bg-[var(--bg-primary,#0a0a0f)]">
      <div
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}

export function ActivityTimeline({
  items,
  className,
}: ActivityTimelineProps) {
  if (items.length === 0) return null;

  return (
    <div className={cn("relative", className)} role="list" aria-label="Activity timeline">
      {/* Animated vertical line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" as const }}
        className="absolute left-[15px] top-4 bottom-4 w-px origin-top bg-white/[0.06]"
      />

      <div className="flex flex-col gap-1">
        {items.map((item, i) => {
          const type = item.type ?? "default";

          return (
            <motion.div
              key={item.id}
              role="listitem"
              custom={i}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="relative flex gap-4 py-2"
            >
              {/* Dot */}
              <div className="shrink-0">
                <TimelineDot type={type} icon={item.icon} />
              </div>

              {/* Content card */}
              <div
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-white/[0.06]",
                  "bg-white/[0.02] backdrop-blur-sm",
                  "px-4 py-3"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium text-white/90 truncate">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[11px] text-white/30">
                    {item.time}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-1 text-xs text-white/40 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
