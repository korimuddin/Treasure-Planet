"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/onboarding-demo", label: "Demo" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/how-ndas-work", label: "Mutual NDAs" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-border bg-[linear-gradient(150deg,rgba(255,255,255,0.10),rgba(22,85,205,0.20))] shadow-[0_20px_60px_rgba(2,7,18,0.28)] backdrop-blur-[18px]">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <Link href="/" className="flex items-center gap-2 font-mono text-[13px] font-black uppercase tracking-[0.24em] text-cream">
          <span aria-hidden="true">⚓</span>
          Treasure Planet
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-mono text-[10px] font-bold uppercase tracking-[0.18em] transition ${
                  active ? "text-cream" : "text-muted hover:text-cream"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="border border-border bg-[linear-gradient(135deg,rgba(255,255,255,0.10),rgba(127,176,255,0.16))] px-4 py-2 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-cream2 transition hover:-translate-y-0.5 hover:border-border2 hover:text-cream"
          >
            Sign In
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="grid h-10 w-10 place-items-center border border-border bg-[rgba(255,255,255,0.08)] text-cream md:hidden"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
        </button>
      </nav>

      {open && (
        <div id="mobile-navigation" className="border-t border-border bg-[rgba(2,7,18,0.96)] p-4 backdrop-blur-[18px] md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-border bg-[linear-gradient(150deg,rgba(255,255,255,0.10),rgba(22,85,205,0.20))] px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-cream2"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="btn-liquid px-4 py-3 text-center font-mono text-xs uppercase tracking-[0.16em]"
              onClick={() => setOpen(false)}
            >
              Sign In
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
