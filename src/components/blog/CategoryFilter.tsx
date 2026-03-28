"use client";

import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: { value: string; label: string }[];
  selected: string;
  onChange: (category: string) => void;
}

export function CategoryFilter({
  categories,
  selected,
  onChange,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
          selected === "all"
            ? "bg-primary text-white shadow-md shadow-primary/25"
            : "bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground",
        )}
      >
        All Posts
      </button>
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className={cn(
            "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200",
            selected === cat.value
              ? "bg-primary text-white shadow-md shadow-primary/25"
              : "bg-white/[0.06] text-muted-foreground hover:bg-white/[0.1] hover:text-foreground",
          )}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
