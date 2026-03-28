"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  side?: "right" | "left" | "bottom";
  children: React.ReactNode;
  className?: string;
}

const slideVariants = {
  right: {
    hidden: { x: "100%" },
    visible: { x: 0 },
  },
  left: {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  },
  bottom: {
    hidden: { y: "100%" },
    visible: { y: 0 },
  },
};

const sideClasses = {
  right: "inset-y-0 right-0 w-full sm:max-w-md",
  left: "inset-y-0 left-0 w-full sm:max-w-md",
  bottom: "inset-x-0 bottom-0 max-h-[90vh] rounded-t-2xl pb-[env(safe-area-inset-bottom)]",
};

export function Drawer({
  open,
  onClose,
  title,
  description,
  side = "right",
  children,
  className,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Capture trigger element and focus close button on open; return focus on close
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

  // Escape key and body scroll lock
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  // Focus trap
  useEffect(() => {
    if (!open || !drawerRef.current) return;
    const drawer = drawerRef.current;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = drawer.querySelectorAll<HTMLElement>(
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

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label={title || "Drawer"}
            variants={slideVariants[side]}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={cn(
              "fixed z-50 flex flex-col border-white/[0.06] bg-[var(--bg-secondary)]",
              side === "right" && "border-l",
              side === "left" && "border-r",
              side === "bottom" && "border-t",
              sideClasses[side],
              className,
            )}
          >
            {/* Header */}
            {(title || description) && (
              <div className="flex items-start justify-between border-b border-white/[0.06] px-6 py-4">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold">{title}</h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {description}
                    </p>
                  )}
                </div>
                <button
                  ref={closeButtonRef}
                  onClick={onClose}
                  aria-label="Close drawer"
                  className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
