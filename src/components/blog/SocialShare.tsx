"use client";

import { useState } from "react";
import { Check, Copy, Linkedin, Twitter } from "lucide-react";

interface SocialShareProps {
  url: string;
  title: string;
}

export function SocialShare({ url, title }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = `https://www.trysovereignai.com${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  function handleCopy() {
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">Share:</span>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X (Twitter)"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground transition-colors hover:bg-white/[0.1] hover:text-foreground"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground transition-colors hover:bg-white/[0.1] hover:text-foreground"
      >
        <Linkedin className="h-3.5 w-3.5" />
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on Facebook"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground transition-colors hover:bg-white/[0.1] hover:text-foreground"
      >
        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>
      <button
        onClick={handleCopy}
        aria-label="Copy link"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-muted-foreground transition-colors hover:bg-white/[0.1] hover:text-foreground"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}
