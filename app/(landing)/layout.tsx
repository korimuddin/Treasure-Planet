import { CookieConsentBanner, PostHogProvider } from "@/components/layout/PostHogProvider";

// The landing page draws its own header and footer over the ocean,
// so it sits outside the (platform) group's SiteNav and Footer.
export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PostHogProvider>
      {children}
      <CookieConsentBanner />
    </PostHogProvider>
  );
}
