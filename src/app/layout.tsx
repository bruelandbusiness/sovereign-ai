import type { Metadata, Viewport } from "next";
import { DM_Sans, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
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
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sovereignai.com"),
  title: {
    default: "Sovereign AI — AI-Powered Marketing for Local Businesses",
    template: "%s | Sovereign AI",
  },
  description:
    "Done-for-you AI marketing automation for HVAC, plumbing, roofing, and home service businesses. 16 AI services that generate leads, book appointments, and grow revenue 24/7.",
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
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${dmSans.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
