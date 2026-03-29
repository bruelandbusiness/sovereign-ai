import type { Metadata, Viewport } from "next";
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/toast-context";
import { Toaster } from "@/components/ui/toaster";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { TrackingScripts } from "@/components/shared/TrackingScripts";
import { UtmCapture } from "@/components/shared/UtmCapture";
import { GlobalWidgets } from "@/components/shared/GlobalWidgets";
import { CookieConsent } from "@/components/shared/CookieConsent";
import { ServiceWorkerRegistration } from "@/components/shared/ServiceWorkerRegistration";
import { PwaInstallPrompt } from "@/components/shared/PwaInstallPrompt";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#4c85ff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://www.trysovereignai.com"),
  title: {
    default: "Sovereign AI — AI-Powered Marketing for Local Businesses",
    template: "%s | Sovereign AI",
  },
  description:
    "Done-for-you AI marketing for HVAC, plumbing, roofing, and home service businesses. 16 AI services generating leads 24/7.",
  keywords: [
    "AI marketing",
    "local business marketing",
    "HVAC marketing",
    "plumbing marketing",
    "roofing marketing",
    "home service marketing",
    "AI lead generation",
    "marketing automation",
  ],
  authors: [{ name: "Sovereign AI" }],
  creator: "Sovereign AI",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Sovereign AI",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Sovereign AI — AI-Powered Marketing for Local Businesses",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@sovereignai",
    images: ["/twitter-image"],
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sovereign AI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/*
          Preconnect hints for tracking domains are intentionally omitted.
          They are loaded dynamically by TrackingScripts only after cookie
          consent is given, to comply with GDPR/ePrivacy requirements.
        */}
        {/* Preconnect to Google Fonts CDN — next/font downloads from here */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* DNS-prefetch for the API domain to reduce latency on first API call */}
        <link rel="dns-prefetch" href="https://www.trysovereignai.com" />
      </head>
      <body
        className={`${dmSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none"
        >
          Skip to content
        </a>
        <PostHogProvider>
          <SessionProvider>
            <ToastProvider>
              <TooltipProvider>{children}</TooltipProvider>
              <Toaster />
            </ToastProvider>
          </SessionProvider>
        </PostHogProvider>
        <TrackingScripts />
        <UtmCapture />
        <GlobalWidgets />
        <CookieConsent />
        <ServiceWorkerRegistration />
        <PwaInstallPrompt />
        <VercelAnalytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
