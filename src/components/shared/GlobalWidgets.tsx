"use client";

import dynamic from "next/dynamic";

const MarketingChatbot = dynamic(
  () =>
    import("@/components/shared/MarketingChatbot").then(
      (m) => m.MarketingChatbot
    ),
  { ssr: false, loading: () => null }
);

const StickyMobileCTA = dynamic(
  () =>
    import("@/components/shared/StickyMobileCTA").then(
      (m) => m.StickyMobileCTA
    ),
  { ssr: false, loading: () => null }
);

const SocialProofToast = dynamic(
  () =>
    import("@/components/shared/SocialProofToast").then(
      (m) => m.SocialProofToast
    ),
  { ssr: false, loading: () => null }
);

/**
 * Global floating widgets (chatbot, sticky CTA, social proof, etc.) rendered once in the root layout.
 * Each widget handles its own visibility, z-index, and positioning.
 */
export function GlobalWidgets() {
  return (
    <>
      <MarketingChatbot />
      <StickyMobileCTA />
      <SocialProofToast />
    </>
  );
}
