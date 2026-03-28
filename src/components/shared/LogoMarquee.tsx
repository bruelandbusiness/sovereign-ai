"use client";

import { cn } from "@/lib/utils";

interface LogoItem {
  name: string;
  className?: string;
}

interface LogoMarqueeProps {
  logos: LogoItem[];
  speed?: "slow" | "normal" | "fast";
  direction?: "left" | "right";
  pauseOnHover?: boolean;
  className?: string;
}

export function LogoMarquee({
  logos,
  speed = "normal",
  direction = "left",
  pauseOnHover = true,
  className,
}: LogoMarqueeProps) {
  if (logos.length === 0) return null;
  const speedMap = { slow: "60s", normal: "30s", fast: "15s" };
  const doubled = [...logos, ...logos];

  return (
    <div
      role="region"
      aria-label="Partner logos"
      className={cn("relative w-full overflow-hidden", className)}
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
      }}
    >
      <div
        className={cn(
          "flex w-max gap-8 sm:gap-12",
          pauseOnHover && "hover:[animation-play-state:paused]",
        )}
        style={{
          animation: `marquee-scroll ${speedMap[speed]} linear infinite`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {doubled.map((logo, i) => (
          <div
            key={`${logo.name}-${i}`}
            className="flex shrink-0 items-center justify-center"
          >
            <span
              className={cn(
                "whitespace-nowrap rounded-full border border-white/[0.06] bg-white/[0.02] px-5 py-2 text-sm font-medium text-muted-foreground/70 transition-colors hover:border-primary/20 hover:text-muted-foreground",
                logo.className,
              )}
            >
              {logo.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
