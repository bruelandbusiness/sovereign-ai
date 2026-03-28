"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Displays a visual pull-to-refresh indicator at the top of
 * the page on mobile. When the user pulls down past a threshold
 * and releases, the page reloads. On desktop the component
 * renders nothing.
 */
export function MobilePullIndicator() {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const isAtTop = useRef(true);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY <= 0) {
      touchStartY.current = e.touches[0].clientY;
      isAtTop.current = true;
    } else {
      isAtTop.current = false;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        touchStartY.current === null ||
        !isAtTop.current ||
        isRefreshing
      ) {
        return;
      }
      const diff = e.touches[0].clientY - touchStartY.current;
      if (diff > 0) {
        // Dampen the pull distance so it doesn't scroll 1:1
        setPullDistance(Math.min(diff * 0.4, 120));
      }
    },
    [isRefreshing],
  );

  const handleTouchEnd = useCallback(() => {
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD * 0.5);
      // Trigger an actual page refresh after a brief animation
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } else {
      setPullDistance(0);
    }
    touchStartY.current = null;
  }, [pullDistance, isRefreshing]);

  useEffect(() => {
    // Only attach on mobile-sized viewports
    const mq = window.matchMedia("(max-width: 639px)");
    if (!mq.matches) return;

    document.addEventListener("touchstart", handleTouchStart, {
      passive: true,
    });
    document.addEventListener("touchmove", handleTouchMove, {
      passive: true,
    });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  if (pullDistance <= 0 && !isRefreshing) return null;

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const rotation = progress * 360;

  return (
    <div
      className="fixed left-1/2 z-50 -translate-x-1/2 sm:hidden"
      style={{ top: Math.max(pullDistance - 40, 8) }}
      aria-hidden="true"
    >
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-lg transition-transform",
          isRefreshing && "animate-spin",
        )}
        style={{
          opacity: progress,
          transform: `rotate(${rotation}deg) scale(${0.6 + progress * 0.4})`,
        }}
      >
        <RefreshCw className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
}
