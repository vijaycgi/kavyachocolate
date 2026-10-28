import type { Metadata, Viewport } from "next";
import { Sen } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

// One family, three registers. Sen's variable 400–800 carries display headings,
// body, labels, tables, tabular figures, and the margin notes; hierarchy comes
// from weight, size, and tracking rather than a second face.
const sen = Sen({
  subsets: ["latin"],
  variable: "--font-sen",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Kavya Chocolat — Bean-to-bar chocolate, made in small batches",
    template: "%s · Kavya Chocolat",
  },
  description:
    "Four honest dark chocolate bars made from real cocoa beans in small batches. Cashew and pistachio, jaggery-sweetened, and classic 70%. Order online without a payment step.",
  applicationName: "Kavya Chocolat",
  keywords: [
    "bean to bar chocolate",
    "dark chocolate India",
    "jaggery chocolate",
    "small batch chocolate",
    "Kavya Chocolat",
  ],
  authors: [{ name: "Kavya Chocolat" }],
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "Kavya Chocolat",
    title: "Kavya Chocolat — Four bars. Nothing to hide.",
    description:
      "Bean-to-bar chocolate made in small batches with real cocoa beans, cashews, pistachios and jaggery.",
    images: [{ url: "/images/editorial/hero.jpg", width: 1500, height: 1875, alt: "Kavya Chocolat dark chocolate" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Kavya Chocolat — Four bars. Nothing to hide.",
    description: "Bean-to-bar chocolate made in small batches.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#75212f",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      data-scroll-behavior="smooth"
      className={`${sen.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
