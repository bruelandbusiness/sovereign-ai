"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { trackVideoPlay } from "@/lib/tracking";

interface VideoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** YouTube video ID (the part after v=) */
  videoId: string;
}

/**
 * Lightweight video modal using the facade pattern:
 * - No YouTube iframe loaded until the modal opens
 * - Autoplays when opened, stops when closed
 * - Responsive 16:9 aspect ratio
 * - Focus trap, Escape key, and focus return for accessibility
 */
export function VideoModal({ open, onOpenChange, videoId }: VideoModalProps) {
  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<Element | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Capture the element that triggered the modal and manage focus
  useEffect(() => {
    if (open) {
      trackVideoPlay("demo-modal");
      triggerRef.current = document.activeElement;
      // Focus the close button when modal opens
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
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, close]);

  // Focus trap
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;

    function handleFocusTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])'
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
      ref={dialogRef}
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Demo video"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={close}
      />

      {/* Close button */}
      <button
        ref={closeButtonRef}
        onClick={close}
        className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label="Close video"
      >
        <X className="h-5 w-5" />
      </button>

      {/* Video container */}
      <div className="relative z-10 w-full max-w-4xl px-4 animate-in zoom-in-95 fade-in-0 duration-200">
        <div className="relative w-full overflow-hidden rounded-xl shadow-2xl" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title="Sovereign AI Demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage video modal state.
 * Usage:
 *   const { videoOpen, openVideo, setVideoOpen } = useVideoModal();
 *   <VideoModal open={videoOpen} onOpenChange={setVideoOpen} videoId="YOUR_ID" />
 */
export function useVideoModal() {
  const [videoOpen, setVideoOpen] = useState(false);
  const openVideo = useCallback(() => setVideoOpen(true), []);
  return { videoOpen, openVideo, setVideoOpen };
}
