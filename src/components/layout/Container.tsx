import { cn } from "@/lib/utils";

const sizes = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
};

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: keyof typeof sizes;
}

export function Container({ children, className, size = "xl" }: ContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)}>
      {children}
    </div>
  );
}
