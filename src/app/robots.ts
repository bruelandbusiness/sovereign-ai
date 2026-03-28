import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/agency/",
          "/dashboard/",
          "/embed/",
          "/onboarding/",
          "/snapshots/",
          "/quotes/",
          "/login/check-email",
          "/offline",
          "/ref/",
          "/referral/",
          "/unsubscribe",
        ],
      },
    ],
    sitemap: "https://www.trysovereignai.com/sitemap.xml",
    host: "https://www.trysovereignai.com",
  };
}
