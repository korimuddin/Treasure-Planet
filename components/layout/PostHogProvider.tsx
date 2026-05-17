"use client";

import { useEffect, useState } from "react";

function getConsent() {
  return document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith("tp_cookie_consent="))
    ?.split("=")[1];
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (getConsent() !== "accepted" || !process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    let cancelled = false;

    import("posthog-js").then(({ default: posthog }) => {
      if (cancelled) return;

      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
        capture_pageview: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return <>{children}</>;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!getConsent());
  }, []);

  function choose(value: "accepted" | "rejected") {
    const maxAge = 60 * 60 * 24 * 365;
    document.cookie = `tp_cookie_consent=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
    setVisible(false);
    if (value === "accepted") {
      window.location.reload();
    }
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] border border-border2 bg-[rgba(7,15,26,0.98)] p-4 shadow-2xl backdrop-blur-3xl md:left-auto md:max-w-xl">
      <p className="font-mono text-xs uppercase tracking-[0.16em] text-gold">Cookie consent</p>
      <p className="mt-2 text-cream2">
        We use essential cookies for security and optional analytics to improve Treasure Planet. Analytics stays off
        unless you accept.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button className="btn-liquid px-4 py-2 font-mono text-xs uppercase tracking-[0.16em]" onClick={() => choose("accepted")}>
          Accept all
        </button>
        <button
          className="border border-border px-4 py-2 font-mono text-xs uppercase tracking-[0.16em] text-cream2"
          onClick={() => choose("rejected")}
        >
          Reject non-essential
        </button>
      </div>
    </div>
  );
}
