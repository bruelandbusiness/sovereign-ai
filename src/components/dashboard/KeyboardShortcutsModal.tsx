"use client";

import { useEffect, useRef } from "react";

interface ShortcutEntry {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutEntry[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: "General",
    shortcuts: [
      { keys: ["\u2318K"], description: "Open command palette" },
      { keys: ["\u2318/"], description: "Toggle keyboard shortcuts" },
      { keys: ["?"], description: "Toggle keyboard shortcuts" },
      { keys: ["Esc"], description: "Close any modal or drawer" },
    ],
  },
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["g", "d"], description: "Go to Dashboard" },
      { keys: ["g", "l"], description: "Go to Leads / CRM" },
      { keys: ["g", "b"], description: "Go to Services" },
      { keys: ["g", "i"], description: "Go to Invoices" },
      { keys: ["g", "s"], description: "Go to Settings" },
      { keys: ["g", "p"], description: "Go to Performance" },
      { keys: ["g", "r"], description: "Go to Reports" },
      { keys: ["g", "m"], description: "Go to Inbox" },
    ],
  },
  {
    title: "Create",
    shortcuts: [
      { keys: ["n", "l"], description: "New lead" },
      { keys: ["n", "i"], description: "New invoice" },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<Element | null>(null);

  // Capture trigger element and focus close button on open
  useEffect(() => {
    if (open) {
      triggerRef.current = document.activeElement;
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else if (triggerRef.current instanceof HTMLElement) {
      triggerRef.current.focus();
      triggerRef.current = null;
    }
  }, [open]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !overlayRef.current) return;
    const dialog = overlayRef.current;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleFocusTrap);
    return () => document.removeEventListener("keydown", handleFocusTrap);
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-card p-4 sm:p-6 shadow-2xl max-sm:mx-4 max-sm:max-h-[85vh] max-sm:overflow-y-auto">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          {SHORTCUT_CATEGORIES.map((category) => (
            <div key={category.title}>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map(({ keys, description }) => (
                  <div key={description} className="flex items-center justify-between">
                    <span className="text-sm text-foreground/80">{description}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((key, i) => (
                        <span key={i} className="flex items-center">
                          {i > 0 && (
                            <span className="mx-1 text-[10px] text-muted-foreground">then</span>
                          )}
                          <kbd className="inline-flex min-w-[1.75rem] items-center justify-center rounded-md border border-border bg-secondary px-2 py-0.5 font-mono text-xs text-foreground">
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
          <p className="text-xs text-muted-foreground">
            Press{" "}
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-foreground/80">
              ?
            </kbd>{" "}
            or{" "}
            <kbd className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-foreground/80">
              {"\u2318/"}
            </kbd>{" "}
            to toggle this panel
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            Shortcuts are disabled while typing
          </p>
        </div>
      </div>
    </div>
  );
}
