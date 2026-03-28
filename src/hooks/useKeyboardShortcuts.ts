"use client";

import { useEffect, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Determines whether the keyboard event originates from a text input context,
 * in which case global shortcuts should be suppressed.
 */
function isTyping(e: KeyboardEvent): boolean {
  const target = e.target as HTMLElement;
  if (!target) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (target.isContentEditable) return true;
  return false;
}

export function useKeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const pendingPrefixRef = useRef<string | null>(null);
  const prefixTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPrefix = useCallback(() => {
    pendingPrefixRef.current = null;
    if (prefixTimerRef.current) {
      clearTimeout(prefixTimerRef.current);
      prefixTimerRef.current = null;
    }
  }, []);

  const startPrefix = useCallback(
    (prefix: string) => {
      clearPrefix();
      pendingPrefixRef.current = prefix;
      prefixTimerRef.current = setTimeout(() => {
        pendingPrefixRef.current = null;
      }, 1000);
    },
    [clearPrefix],
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // ---------------------------------------------------------------
      // Cmd+K / Ctrl+K — toggle command palette (works even in inputs)
      // ---------------------------------------------------------------
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
        setShowHelp(false);
        clearPrefix();
        return;
      }

      // ---------------------------------------------------------------
      // Cmd+/ or Ctrl+/ — toggle keyboard shortcuts help
      // ---------------------------------------------------------------
      if (e.key === "/" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        setShowCommandPalette(false);
        clearPrefix();
        return;
      }

      // Skip remaining shortcuts when the user is typing in an input
      if (isTyping(e)) return;

      // ---------------------------------------------------------------
      // Escape — close any open modal/drawer
      // ---------------------------------------------------------------
      if (e.key === "Escape") {
        if (showCommandPalette) {
          setShowCommandPalette(false);
          e.preventDefault();
        } else if (showHelp) {
          setShowHelp(false);
          e.preventDefault();
        }
        clearPrefix();
        return;
      }

      // ---------------------------------------------------------------
      // ? (Shift+/) — toggle keyboard shortcuts help
      // ---------------------------------------------------------------
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        setShowCommandPalette(false);
        clearPrefix();
        return;
      }

      // ---------------------------------------------------------------
      // Handle "g" prefix sequences — Go to ...
      // ---------------------------------------------------------------
      if (pendingPrefixRef.current === "g") {
        e.preventDefault();
        clearPrefix();

        switch (e.key) {
          case "d":
            router.push("/dashboard");
            break;
          case "l":
            router.push("/dashboard/crm");
            break;
          case "b":
            router.push("/dashboard/services");
            break;
          case "i":
            router.push("/dashboard/invoices");
            break;
          case "s":
            router.push("/dashboard/settings/account");
            break;
          case "p":
            router.push("/dashboard/performance");
            break;
          case "r":
            router.push("/dashboard/reports");
            break;
          case "m":
            router.push("/dashboard/inbox");
            break;
          default:
            break;
        }
        return;
      }

      // ---------------------------------------------------------------
      // Handle "n" prefix sequences — New ...
      // ---------------------------------------------------------------
      if (pendingPrefixRef.current === "n") {
        e.preventDefault();
        clearPrefix();

        switch (e.key) {
          case "l":
            router.push("/dashboard/crm?action=new");
            break;
          case "i":
            router.push("/dashboard/invoices?action=new");
            break;
          default:
            break;
        }
        return;
      }

      // ---------------------------------------------------------------
      // Start "g" prefix — wait for next key within 1 second
      // ---------------------------------------------------------------
      if (e.key === "g" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        startPrefix("g");
        return;
      }

      // ---------------------------------------------------------------
      // Start "n" prefix — wait for next key within 1 second
      // ---------------------------------------------------------------
      if (e.key === "n" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        startPrefix("n");
        return;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearPrefix();
    };
  }, [router, showHelp, showCommandPalette, clearPrefix, startPrefix]);

  return { showHelp, setShowHelp, showCommandPalette, setShowCommandPalette };
}
