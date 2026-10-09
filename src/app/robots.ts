import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharscan-buddy.vercel.app";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/faq", "/privacy"],
        disallow: [
          "/dashboard",
          "/inventory",
          "/scan",
          "/receipt-scan",
          "/grocery-list",
          "/meal-planner",
          "/ai-meal-planner",
          "/family",
          "/analytics",
          "/notifications",
          "/settings",
          "/onboarding",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}