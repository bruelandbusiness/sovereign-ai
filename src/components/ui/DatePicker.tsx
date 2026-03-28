"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date;
}

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  className,
  minDate,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(value ?? new Date());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const isSelected = (day: number) =>
    value &&
    value.getDate() === day &&
    value.getMonth() === month &&
    value.getFullYear() === year;

  const isDisabled = (day: number) => {
    if (!minDate) return false;
    return new Date(year, month, day) < new Date(minDate.toDateString());
  };

  const isToday = (day: number) => {
    const t = new Date();
    return t.getDate() === day && t.getMonth() === month && t.getFullYear() === year;
  };

  return (
    <div ref={ref} className={cn("relative w-full", className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={value ? `Selected date: ${value.toLocaleDateString()}` : placeholder}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-sm outline-none transition-colors focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
      >
        <Calendar className="h-4 w-4 text-muted-foreground" />
        {value ? (
          <span>
            {value.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ) : (
          <span className="text-muted-foreground/50">{placeholder}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-white/[0.08] bg-[var(--bg-secondary)] p-4 shadow-2xl"
          >
            {/* Month nav */}
            <div className="mb-3 flex items-center justify-between">
              <button
                onClick={() => setViewMonth(new Date(year, month - 1))}
                aria-label="Previous month"
                className="rounded-lg p-1 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium">
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={() => setViewMonth(new Date(year, month + 1))}
                aria-label="Next month"
                className="rounded-lg p-1 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Grid */}
            <div role="grid" aria-label={`${MONTHS[month]} ${year}`} className="grid grid-cols-7 gap-0.5 text-center text-xs">
              {DAYS.map((d) => (
                <div key={d} role="columnheader" className="py-1.5 font-medium text-muted-foreground/60">
                  {d}
                </div>
              ))}
              {Array.from({ length: firstDay }, (_, i) => (
                <div key={`e-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const disabled = isDisabled(day);
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    disabled={disabled}
                    aria-label={`${MONTHS[month]} ${day}, ${year}`}
                    aria-pressed={selected || undefined}
                    onClick={() => {
                      onChange?.(new Date(year, month, day));
                      setOpen(false);
                    }}
                    className={cn(
                      "rounded-lg py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      disabled && "cursor-not-allowed text-muted-foreground/20",
                      !disabled && !selected && "hover:bg-white/[0.06]",
                      selected &&
                        "bg-gradient-to-r from-[#4c85ff] to-[#22d3a1] text-white font-medium",
                      today && !selected && "text-primary font-medium",
                    )}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
