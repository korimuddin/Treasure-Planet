"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Particle = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  color: string;
};

const trustStats = [
  ["⚓", "247", "Anonymous Listings"],
  ["🔐", "Mutual", "NDA on Every Deal"],
  ["🛡️", "Seller", "Controls Access"],
  ["💰", "10%", "Fee on Close Only"],
  ["🚢", "£1.2M", "Value Transacted"],
];

const depthMarkers = ["0m", "200m", "800m", "2000m", "4000m"];
const coordinateMarkers = ["38°N", "24°W", "16°S", "04°E"];

export default function HomePage() {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }, (_, index) => {
        const teal = index % 3 === 0;
        return {
          id: index,
          left: (index * 37) % 100,
          delay: (index * 0.47) % 8,
          duration: 8 + (index % 6),
          size: 2 + (index % 4),
          opacity: 0.18 + ((index % 5) * 0.06),
          color: teal ? "61,184,144" : "200,168,75",
        };
      }),
    );
  }, []);

  return (
    <main className="relative isolate overflow-hidden bg-ink">
      <Atmosphere particles={particles} />

      <section className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-20 h-px bg-[linear-gradient(90deg,transparent,rgba(200,168,75,0.54),transparent)]"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(200,168,75,0.38),transparent)]"
        />

        <MarkerRail values={depthMarkers} side="left" />
        <MarkerRail values={coordinateMarkers} side="right" />

        <div className="mx-auto max-w-4xl">
          <div
            className="mx-auto flex max-w-md items-center gap-4 opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{ animationDelay: "0.2s" }}
          >
            <span className="h-px flex-1 bg-[linear-gradient(90deg,transparent,var(--teal2))]" />
            <p className="font-mono text-[9px] uppercase tracking-[0.28em] text-teal2">
              Ancient Code · New Horizons
            </p>
            <span className="h-px flex-1 bg-[linear-gradient(90deg,var(--teal2),transparent)]" />
          </div>

          <p
            className="mt-7 text-3xl italic text-cream2 opacity-0 [animation:fade-up_700ms_ease_forwards] sm:text-4xl"
            style={{ animationDelay: "0.35s" }}
          >
            Find Hidden Treasure
          </p>
          <h1
            className="mt-2 font-display text-[clamp(4rem,16vw,8rem)] uppercase leading-[0.85] text-gold opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{
              animationDelay: "0.45s",
              textShadow: "0 0 26px rgba(200,168,75,0.32), 0 0 72px rgba(200,168,75,0.14)",
            }}
          >
            IN THE DEPTHS
          </h1>
          <p
            className="mt-2 text-3xl italic text-cream2 opacity-0 [animation:fade-up_700ms_ease_forwards] sm:text-4xl"
            style={{ animationDelay: "0.55s" }}
          >
            of abandoned software
          </p>
          <p
            className="mx-auto mt-7 max-w-2xl text-xl leading-8 text-cream2 opacity-0 [animation:fade-up_700ms_ease_forwards] sm:text-2xl"
            style={{ animationDelay: "0.65s" }}
          >
            Thousands of projects are shipwrecked — fully built, never launched. Buy them, revive them, or find a
            cofounder to finish what was started.
          </p>
          <p
            className="mt-5 font-mono text-[9.5px] uppercase tracking-[0.1em] text-[rgba(200,168,75,0.4)] opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{ animationDelay: "0.72s" }}
          >
            Every deal protected by our mutual NDA
          </p>
          <div className="mt-9 opacity-0 [animation:fade-up_700ms_ease_forwards]" style={{ animationDelay: "0.8s" }}>
            <Link
              href="/marketplace"
              className="btn-liquid inline-flex items-center gap-3 border-gold px-6 py-4 font-mono text-xs uppercase tracking-[0.18em] text-gold"
            >
              Enter the Depths
              <svg aria-hidden="true" width="14" height="18" viewBox="0 0 14 18" fill="none">
                <path d="M7 1v14M2 10l5 5 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </Link>
          </div>

          <div
            className="mt-14 flex flex-col items-center gap-3 opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{ animationDelay: "1.2s" }}
          >
            <p className="font-mono text-[8px] uppercase tracking-[0.24em] text-muted">Descend</p>
            <span className="relative h-12 w-px overflow-hidden bg-border">
              <span className="absolute left-0 top-0 h-4 w-px bg-gold [animation:scroll-drop_1.8s_ease-in-out_infinite]" />
            </span>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-border bg-[rgba(7,15,26,0.8)] backdrop-blur-md">
        <div className="mx-auto grid max-w-7xl grid-cols-3 overflow-x-auto lg:grid-cols-5">
          {trustStats.map(([emoji, value, label], index) => (
            <div
              key={label}
              className={`min-w-[180px] px-4 py-5 text-center ${index > 0 ? "border-l border-border" : ""} ${
                index > 2 ? "hidden lg:block" : ""
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {emoji}
              </span>
              <p className="mt-1 font-display text-lg uppercase text-gold">{value}</p>
              <p className="font-mono text-[7.5px] uppercase tracking-[0.18em] text-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Atmosphere({ particles }: { particles: Particle[] }) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_60%_at_50%_-10%,rgba(18,36,64,0.9),transparent_65%),radial-gradient(ellipse_80%_50%_at_10%_40%,rgba(27,153,112,0.07),transparent_55%),radial-gradient(ellipse_70%_50%_at_92%_30%,rgba(200,168,75,0.06),transparent_60%),radial-gradient(ellipse_100%_80%_at_50%_100%,rgba(4,9,15,1),rgba(4,9,15,0)_60%),linear-gradient(180deg,#04090F,#070F1A_25%,#0B1826_50%,#070F1A_75%,#04090F)]" />
      <div className="absolute left-[8%] top-[24%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(61,184,144,0.18),transparent_68%)] [animation:glow-pulse_8s_ease-in-out_infinite]" />
      <div className="absolute right-[14%] top-[36%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(200,168,75,0.13),transparent_70%)] [animation:glow-pulse_11s_ease-in-out_infinite]" />
      <div className="absolute bottom-[15%] left-[42%] h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(61,184,144,0.12),transparent_70%)] [animation:glow-pulse_6s_ease-in-out_infinite]" />
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute bottom-[-2rem] rounded-full"
          style={{
            left: `${particle.left}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            backgroundColor: `rgba(${particle.color},${particle.opacity})`,
            animation: `float-up ${particle.duration}s linear infinite`,
            animationDelay: `${particle.delay}s`,
            "--float-start": "105vh",
            "--float-end": "-12vh",
            transform: "translateY(105vh)",
          } as React.CSSProperties & {
            "--float-start": string;
            "--float-end": string;
          }}
        />
      ))}
      <div className="absolute left-0 right-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(226,197,112,0.5),transparent)] [animation:scan_5s_linear_infinite]" />
      <svg
        className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.035] [animation:compass-rotate_120s_linear_infinite]"
        viewBox="0 0 200 200"
      >
        <circle cx="100" cy="100" r="78" fill="none" stroke="currentColor" strokeWidth="1" />
        <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="0.7" />
        <path d="M100 8v184M8 100h184M38 38l124 124M162 38 38 162" stroke="currentColor" strokeWidth="0.7" />
        <text x="100" y="24" textAnchor="middle" fontSize="12" fill="currentColor">
          N
        </text>
        <text x="100" y="184" textAnchor="middle" fontSize="12" fill="currentColor">
          S
        </text>
        <text x="181" y="104" textAnchor="middle" fontSize="12" fill="currentColor">
          E
        </text>
        <text x="19" y="104" textAnchor="middle" fontSize="12" fill="currentColor">
          W
        </text>
      </svg>
    </div>
  );
}

function MarkerRail({ values, side }: { values: string[]; side: "left" | "right" }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute top-28 hidden h-[68%] flex-col justify-between font-mono text-[8px] uppercase tracking-[0.18em] text-[rgba(200,168,75,0.22)] md:flex ${
        side === "left" ? "left-6 items-start" : "right-6 items-end"
      }`}
    >
      {values.map((value) => (
        <span key={value}>{value}</span>
      ))}
    </div>
  );
}
