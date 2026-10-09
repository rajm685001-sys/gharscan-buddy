export const siteConfig = {
  name: "GharScan Buddy",
  description:
    "A shared household workspace for inventory, groceries, expiry tracking, and meal planning.",
  tagline: "Know what is at home before you shop.",
  url:
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharscan-buddy.vercel.app",
} as const;