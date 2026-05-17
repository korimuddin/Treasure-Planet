import Link from "next/link";

const links = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/how-ndas-work", label: "How NDAs Work" },
  { href: "/legal", label: "Terms" },
  { href: "/legal", label: "Privacy" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-[rgba(4,9,15,0.95)] px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        <Link href="/" className="font-display text-4xl uppercase text-gold">
          <span aria-hidden="true">⚓</span> Treasure Planet
        </Link>
        <p className="text-xl italic text-muted">Where shipwrecked code finds new seas.</p>
        <nav className="flex flex-wrap justify-center gap-4 font-mono text-[8px] uppercase tracking-[0.18em] text-muted" aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={`${link.href}-${link.label}`} href={link.href} className="transition hover:text-gold">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
          © 2025 Treasure Planet · 10% fee on close · No listing fees
        </p>
      </div>
    </footer>
  );
}
