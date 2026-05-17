import { CookieConsentBanner, PostHogProvider } from "@/components/layout/PostHogProvider";
import { Footer } from "@/components/layout/Footer";
import { SiteNav } from "@/components/layout/SiteNav";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PostHogProvider>
      <SiteNav />
      <div className="h-16" aria-hidden="true" />
      {children}
      <Footer />
      <CookieConsentBanner />
    </PostHogProvider>
  );
}
