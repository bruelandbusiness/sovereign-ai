import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Sovereign AI",
    short_name: "Sovereign AI",
    description:
      "AI-Powered Marketing for Local Businesses — 16 AI services that generate leads, book appointments, and grow revenue 24/7.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#4c85ff",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
