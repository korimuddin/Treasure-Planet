import type { Metadata } from "next";
import { Bebas_Neue, Cormorant_Garamond, DM_Mono } from "next/font/google";
import "@/styles/globals.css";

const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
    default: "Treasure Planet — Unfinished Software Marketplace",
    template: "%s | Treasure Planet",
  },
  description:
    "A marketplace for unfinished and dormant software projects. Buy, co-found or merge web apps, mobile apps and games, with optional anonymity and a mutual NDA.",
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
    title: "Treasure Planet — Unfinished Software Marketplace",
    description:
      "Discover unfinished software projects, request access to private details, and close deals with payment held until you confirm receipt.",
    url: "https://treasureplanet.io",
    siteName: "Treasure Planet",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Treasure Planet unfinished software marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Treasure Planet — Unfinished Software Marketplace",
    description:
      "A marketplace for unfinished and dormant software projects, with optional anonymity and a mutual NDA.",
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
      className={`${bebasNeue.variable} ${cormorantGaramond.variable} ${dmMono.variable}`}
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
