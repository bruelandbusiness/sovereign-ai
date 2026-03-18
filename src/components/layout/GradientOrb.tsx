import { cn } from "@/lib/utils";

const positions = {
  "top-left": "-top-32 -left-32",
  "top-right": "-top-32 -right-32",
  center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
  "bottom-left": "-bottom-32 -left-32",
  "bottom-right": "-bottom-32 -right-32",
};

const sizes = {
  sm: "h-64 w-64",
  md: "h-96 w-96",
  lg: "h-[500px] w-[500px]",
};

const colors = {
  primary: "from-primary/20 to-transparent",
  accent: "from-accent/20 to-transparent",
  mixed: "from-primary/15 via-accent/10 to-transparent",
};

interface GradientOrbProps {
  className?: string;
  color?: keyof typeof colors;
  size?: keyof typeof sizes;
  position?: keyof typeof positions;
}

export function GradientOrb({
  className,
  color = "primary",
  size = "md",
  position = "center",
}: GradientOrbProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute rounded-full bg-radial blur-3xl",
        sizes[size],
        positions[position],
        colors[color],
        className
      )}
      aria-hidden
    />
  );
}
