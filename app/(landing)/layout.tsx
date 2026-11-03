import { Wix_Madefor_Display, Wix_Madefor_Text } from "next/font/google";
import { CookieConsentBanner, PostHogProvider } from "@/components/layout/PostHogProvider";

// The landing page uses the Dusk type pairing; the rest of the app keeps its own faces.
const wixDisplay = Wix_Madefor_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-wix-display",
  display: "swap",
});

const wixText = Wix_Madefor_Text({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-wix-text",
  display: "swap",
});

// The landing page draws its own header and footer over the ocean,
// so it sits outside the (platform) group's SiteNav and Footer.
export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PostHogProvider>
      <div className={`${wixDisplay.variable} ${wixText.variable}`}>{children}</div>
      <CookieConsentBanner />
    </PostHogProvider>
  );
}
