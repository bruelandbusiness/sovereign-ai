"use client";

import { useState } from "react";
import useSWR from "swr";
import { MapPin, ChevronDown } from "lucide-react";
import { fetcher } from "@/lib/fetcher";

interface LocationOption {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  isPrimary: boolean;
}

interface LocationSwitcherProps {
  onLocationChange?: (locationId: string | null) => void;
}

export function LocationSwitcher({ onLocationChange }: LocationSwitcherProps) {
  const { data: locations, error } = useSWR<LocationOption[]>("/api/dashboard/locations", fetcher);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Don't render on error or if fewer than 2 locations
  if (error) return null;
  if (!locations || locations.length < 2) return null;

  const selected = selectedId
    ? locations.find((l) => l.id === selectedId)
    : null;

  const displayName = selected ? selected.name : "All Locations";

  function handleSelect(id: string | null) {
    setSelectedId(id);
    setIsOpen(false);
    onLocationChange?.(id);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Location: ${displayName}`}
      >
        <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        <span>{displayName}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute left-0 top-full z-40 mt-1 w-56 rounded-lg border border-border/50 bg-card py-1 shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
            role="listbox"
            aria-label="Select location"
          >
            <button
              onClick={() => handleSelect(null)}
              role="option"
              aria-selected={!selectedId}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none ${
                !selectedId ? "text-primary font-medium" : "text-foreground"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              All Locations
            </button>
            <div className="my-1 border-t border-border/30" role="separator" />
            {locations.map((loc) => (
              <button
                key={loc.id}
                onClick={() => handleSelect(loc.id)}
                role="option"
                aria-selected={selectedId === loc.id}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/[0.04] focus-visible:bg-white/[0.04] focus-visible:outline-none ${
                  selectedId === loc.id ? "text-primary font-medium" : "text-foreground"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="truncate">{loc.name}</span>
                {loc.city && loc.state && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {loc.city}, {loc.state}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
