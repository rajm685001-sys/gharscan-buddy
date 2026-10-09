import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { ThemeProvider } from "@/providers/theme-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://gharscan-buddy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GharScan Buddy | Shared household inventory",
    template: "%s | GharScan Buddy",
  },
  description:
    "GharScan Buddy helps families and roommates track household items, manage groceries, monitor expiry dates, and plan meals together.",
  applicationName: "GharScan Buddy",
  authors: [{ name: "GharScan Buddy" }],
  creator: "GharScan Buddy",
  publisher: "GharScan Buddy",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: "GharScan Buddy",
    title: "GharScan Buddy | Shared household inventory",
    description:
      "Track what is at home, coordinate shopping, and plan meals with your household.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "GharScan Buddy shared household inventory workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GharScan Buddy | Shared household inventory",
    description:
      "A shared household workspace for inventory, groceries, and meal planning.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#087f5b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} min-h-screen bg-background font-sans text-foreground antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}