"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const links = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/how-ndas-work", label: "Mutual NDAs" },
  { href: "/about", label: "About" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-border bg-[rgba(4,9,15,0.72)] backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Primary navigation">
        <Link href="/" className="flex items-center gap-2 font-display text-3xl uppercase tracking-wide text-gold">
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
                className={`font-mono text-[10px] uppercase tracking-[0.18em] transition ${
                  active ? "text-gold" : "text-muted hover:text-gold"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/login"
            className="border border-border px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-cream2 transition hover:border-border2 hover:text-gold"
          >
            Sign In
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          className="grid h-10 w-10 place-items-center border border-border text-gold md:hidden"
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X aria-hidden="true" size={18} /> : <Menu aria-hidden="true" size={18} />}
        </button>
      </nav>

      {open && (
        <div id="mobile-navigation" className="border-t border-border bg-[rgba(4,9,15,0.98)] p-4 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-border bg-[rgba(7,15,26,0.78)] px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] text-cream2"
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
