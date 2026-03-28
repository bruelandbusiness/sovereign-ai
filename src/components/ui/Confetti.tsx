"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfettiPiece {
  id: number;
  x: number;
  color: string;
  delay: number;
  rotation: number;
  size: number;
  fallDuration: number;
}

interface ConfettiProps {
  active: boolean;
  duration?: number;
  count?: number;
}

const COLORS = ["#4c85ff", "#22d3a1", "#7c5cfc", "#f59e0b", "#ef4444", "#ec4899", "#22c55e"];

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    size: Math.random() * 8 + 4,
    fallDuration: 2.5 + Math.random(),
  }));
}

export function Confetti({ active, duration = 3000, count = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);

  // Generating confetti pieces in response to the `active` prop is a legitimate
  // external-state-sync pattern — the effect reacts to prop transitions and
  // schedules cleanup via setTimeout. Suppressing the lint rule here is
  // intentional and justified.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    setPieces(generatePieces(count));

    const timer = setTimeout(() => setPieces([]), duration);
    return () => clearTimeout(timer);
  }, [active, count, duration]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <AnimatePresence>
      {pieces.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
          {pieces.map((piece) => (
            <motion.div
              key={piece.id}
              initial={{
                x: `${piece.x}vw`,
                y: -20,
                rotate: 0,
                opacity: 1,
              }}
              animate={{
                y: "110vh",
                rotate: piece.rotation + 720,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: piece.fallDuration,
                delay: piece.delay,
                ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
              }}
              style={{
                position: "absolute",
                width: piece.size,
                height: piece.size * 0.6,
                backgroundColor: piece.color,
                borderRadius: 2,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}
