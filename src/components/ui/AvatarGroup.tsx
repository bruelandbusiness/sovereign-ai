"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarGroupProps {
  avatars: { name: string; src?: string }[];
  max?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
};

function getInitials(name: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}

const colors = [
  "from-[#4c85ff] to-[#22d3a1]",
  "from-[#7c5cfc] to-[#4c85ff]",
  "from-[#22d3a1] to-[#10b981]",
  "from-[#f59e0b] to-[#f97316]",
  "from-[#ef4444] to-[#ec4899]",
];

export function AvatarGroup({
  avatars,
  max = 5,
  size = "md",
  className,
}: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className={cn("flex items-center -space-x-2", className)}>
      {visible.map((avatar, i) => (
        <div
          key={avatar.name}
          className={cn(
            "relative inline-flex items-center justify-center rounded-full border-2 border-[var(--bg-primary)] font-medium text-white ring-0",
            sizes[size],
            avatar.src ? "" : `bg-gradient-to-br ${colors[i % colors.length]}`,
          )}
          title={avatar.name}
          style={{ zIndex: visible.length - i }}
        >
          {avatar.src ? (
            <Image
              src={avatar.src}
              alt={avatar.name}
              fill
              sizes="44px"
              className="rounded-full object-cover"
            />
          ) : (
            getInitials(avatar.name)
          )}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "relative inline-flex items-center justify-center rounded-full border-2 border-[var(--bg-primary)] bg-white/[0.08] font-medium text-muted-foreground",
            sizes[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
