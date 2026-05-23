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
    <footer className="border-t border-border bg-[linear-gradient(150deg,rgba(255,255,255,0.08),rgba(22,85,205,0.18))] px-4 py-10 backdrop-blur-[18px]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center">
        <Link href="/" className="font-mono text-[13px] font-black uppercase tracking-[0.24em] text-cream">
          <span aria-hidden="true">⚓</span> Treasure Planet
        </Link>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">Where shipwrecked code finds new seas.</p>
        <nav className="flex flex-wrap justify-center gap-4 font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted" aria-label="Footer navigation">
          {links.map((link) => (
            <Link key={`${link.href}-${link.label}`} href={link.href} className="transition hover:text-cream">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="font-mono text-[8px] font-bold uppercase tracking-[0.18em] text-muted">
          © 2025 Treasure Planet · 10% fee on close · No listing fees
        </p>
      </div>
    </footer>
  );
}
