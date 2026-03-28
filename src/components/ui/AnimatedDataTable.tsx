"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  className?: string;
}

interface AnimatedDataTableProps<T extends { id: string | number }> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchKeys?: (keyof T & string)[];
  className?: string;
  onRowClick?: (row: T) => void;
}

export function AnimatedDataTable<T extends { id: string | number }>({
  columns,
  data,
  searchable = true,
  searchKeys,
  className,
  onRowClick,
}: AnimatedDataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const keys = searchKeys ?? columns.map((c) => c.key);
  const filtered = data.filter((row) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return keys.some((k) => String(row[k]).toLowerCase().includes(q));
  });

  const sorted = sortKey
    ? [...filtered].sort((a, b) => {
        const av = a[sortKey as keyof T];
        const bv = b[sortKey as keyof T];
        const cmp = String(av).localeCompare(String(bv), undefined, {
          numeric: true,
        });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : filtered;

  return (
    <div className={cn("w-full", className)}>
      {searchable && (
        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search table"
            className="h-11 w-full max-w-sm rounded-lg border border-white/[0.08] bg-white/[0.04] pl-10 pr-4 text-base outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 sm:text-sm"
          />
        </div>
      )}

      <div className="relative overflow-x-auto rounded-xl border border-white/[0.06] [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
        <table className="w-full min-w-[480px]">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground",
                    col.sortable && "cursor-pointer select-none hover:text-foreground",
                    col.className,
                  )}
                  onClick={() => col.sortable && toggleSort(col.key)}
                  aria-sort={
                    col.sortable && sortKey === col.key
                      ? sortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : undefined
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortKey === col.key && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        {sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </motion.span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <AnimatePresence mode="popLayout">
            <tbody>
              {sorted.map((row, i) => (
                <motion.tr
                  key={row.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 12 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "border-b border-white/[0.04] transition-colors",
                    onRowClick && "cursor-pointer",
                    "hover:bg-white/[0.02]",
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-sm", col.className)}>
                      {col.render
                        ? col.render(row[col.key], row)
                        : String(row[col.key])}
                    </td>
                  ))}
                </motion.tr>
              ))}
              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </AnimatePresence>
        </table>
      </div>

      <div className="mt-2 text-right text-xs text-muted-foreground">
        {sorted.length} of {data.length} results
      </div>
    </div>
  );
}
