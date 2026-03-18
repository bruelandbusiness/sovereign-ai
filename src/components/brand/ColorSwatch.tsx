"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ColorSwatchProps {
  name: string;
  hex: string;
  cssVar: string;
  className?: string;
}

export function ColorSwatch({ name, hex, cssVar, className }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = hex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }, [hex]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "group flex flex-col items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-left transition-all hover:border-white/20 hover:bg-white/[0.07]",
        className
      )}
    >
      <div
        className="h-16 w-full rounded-lg border border-white/10"
        style={{ backgroundColor: hex }}
      />
      <div className="w-full space-y-1">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="font-mono text-xs text-muted-foreground">{hex}</p>
        <p className="font-mono text-xs text-muted-foreground">{cssVar}</p>
      </div>
      <span
        className={cn(
          "text-xs font-medium transition-opacity",
          copied ? "text-accent opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100"
        )}
      >
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </button>
  );
}
