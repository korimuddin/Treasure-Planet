import type { Metadata } from "next";
import { DM_Mono, Inter } from "next/font/google";
import "@/styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://treasureplanet.io"),
  title: {
    default: "Treasure Planet — Abandoned Software Marketplace",
    template: "%s | Treasure Planet",
  },
  description:
    "The world's first anonymous marketplace for abandoned software projects, where verified buyers discover unfinished apps, games, and products protected by mutual NDA.",
  keywords: [
    "abandoned software",
    "sell app",
    "buy startup code",
    "software marketplace",
    "buy app source code",
    "sell software project",
    "unfinished startup",
    "app marketplace",
    "SaaS acquisition",
    "mutual NDA marketplace",
  ],
  openGraph: {
    type: "website",
    title: "Treasure Planet — Abandoned Software Marketplace",
    description:
      "Discover anonymous abandoned software projects, request mutual NDA access, and close deals with verified buyers and sellers.",
    url: "https://treasureplanet.io",
    siteName: "Treasure Planet",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Treasure Planet abandoned software marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Treasure Planet — Abandoned Software Marketplace",
    description:
      "An anonymous marketplace for abandoned software projects, protected by mutual NDA.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${dmMono.variable}`}
    >
      <body className="min-h-screen bg-ink text-cream antialiased selection:bg-gold-dim selection:text-gold2">
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-24 border border-gold bg-ink2 px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-gold transition focus:translate-y-0"
        >
          Skip to main content
        </a>
        <div id="main-content">{children}</div>
      </body>
    </html>
  );
}
