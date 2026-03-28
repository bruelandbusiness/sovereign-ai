import type { Metadata } from "next";
import {
  LegalPageLayout,
  type LegalSection,
} from "@/components/legal/LegalPageLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "Sovereign AI cookie policy — how we use cookies and similar technologies.",
  alternates: { canonical: "/legal/cookies" },
  openGraph: {
    title: "Cookie Policy | Sovereign AI",
    description:
      "Sovereign AI cookie policy — how we use cookies and similar technologies.",
    url: "/legal/cookies",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookie Policy | Sovereign AI",
    description:
      "Sovereign AI cookie policy — how we use cookies and similar technologies.",
  },
};

const sections: readonly LegalSection[] = [
  {
    id: "what-are-cookies",
    number: 1,
    title: "What Are Cookies",
    content: (
      <p>
        Cookies are small text files stored on your device when you visit a
        website. They help the site remember your preferences, keep you logged
        in, and understand how you use the site.
      </p>
    ),
  },
  {
    id: "how-we-use",
    number: 2,
    title: "How We Use Cookies",
    content: (
      <>
        <p>Sovereign AI uses cookies for the following purposes:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Essential Cookies:</strong>{" "}
            Required for authentication, session management, and security.
            These cannot be disabled.
          </li>
          <li>
            <strong className="text-foreground">Functional Cookies:</strong>{" "}
            Remember your preferences such as language, theme, and dashboard
            layout.
          </li>
          <li>
            <strong className="text-foreground">Analytics Cookies:</strong>{" "}
            Help us understand how visitors interact with our platform so we
            can improve the experience.
          </li>
          <li>
            <strong className="text-foreground">Marketing Cookies:</strong>{" "}
            Used to deliver relevant content and measure campaign
            effectiveness.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "third-party",
    number: 3,
    title: "Third-Party Cookies",
    content: (
      <>
        <p>Some cookies are set by third-party services we use:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Stripe:</strong> Payment
            processing and fraud prevention.
          </li>
          <li>
            <strong className="text-foreground">Analytics providers:</strong>{" "}
            Anonymous usage statistics to improve our platform.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "managing-cookies",
    number: 4,
    title: "Managing Cookies",
    content: (
      <>
        <p>
          You can control cookies through your browser settings. Most browsers
          allow you to block or delete cookies. Note that disabling essential
          cookies may prevent you from using certain features of our platform.
        </p>
        <p className="mt-2">
          When you first visit our site, we present a cookie consent banner that
          lets you choose which non-essential cookie categories to accept.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    number: 5,
    title: "Changes to This Policy",
    content: (
      <p>
        We may update this cookie policy from time to time. Changes will be
        posted on this page with an updated revision date.
      </p>
    ),
  },
  {
    id: "contact",
    number: 6,
    title: "Contact",
    content: (
      <p>
        If you have questions about our use of cookies, please contact us at{" "}
        <a
          href="mailto:privacy@trysovereignai.com"
          className="text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        >
          privacy@trysovereignai.com
        </a>
        .
      </p>
    ),
  },
];

export default function CookiePolicyPage() {
  return (
    <LegalPageLayout
      title="Cookie Policy"
      lastUpdated="March 28, 2026"
      sections={sections}
    />
  );
}
