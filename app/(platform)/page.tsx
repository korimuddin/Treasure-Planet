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
      <WaterWaves />
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

function WaterWaves() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[42vh] bg-[linear-gradient(180deg,rgba(75,86,255,0.34),rgba(19,36,91,0.18)_38%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-[5vh] h-[38vh] opacity-70 blur-[1px] [animation:wave-swell_12s_ease-in-out_infinite]">
        <WaveBand className="text-[#1b2d86] opacity-55 [animation:wave-drift_16s_ease-in-out_infinite_alternate]" yOffset={0} />
        <WaveBand className="top-[4rem] text-[#102660] opacity-70 [animation:wave-drift_22s_ease-in-out_infinite_alternate-reverse]" yOffset={18} />
        <WaveBand className="top-[8.5rem] text-[#061a3f] opacity-90 [animation:wave-drift_27s_ease-in-out_infinite_alternate]" yOffset={36} />
      </div>
      <div className="absolute inset-x-[-18%] top-[18vh] h-[70vh] opacity-20 mix-blend-screen blur-xl [background-image:linear-gradient(112deg,transparent_0%,transparent_38%,rgba(96,118,255,0.22)_46%,transparent_56%,transparent_100%),linear-gradient(68deg,transparent_0%,transparent_36%,rgba(61,184,144,0.14)_44%,transparent_54%,transparent_100%)] [background-size:42rem_100%,52rem_100%] [mask-image:linear-gradient(180deg,transparent,black_18%,black_72%,transparent)] [animation:water-shimmer_22s_linear_infinite]" />
      <div className="absolute inset-x-0 top-[28vh] h-[55vh] bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(77,88,255,0.18),transparent_68%)] opacity-80" />
    </div>
  );
}

function WaveBand({ className, yOffset }: { className: string; yOffset: number }) {
  return (
    <svg
      className={`absolute left-[-10%] h-52 w-[120%] ${className}`}
      viewBox="0 0 1600 260"
      preserveAspectRatio="none"
      style={{ top: yOffset }}
    >
      <path
        fill="currentColor"
        d="M0 98C76 54 140 72 212 92C292 114 362 127 438 82C518 36 579 55 650 89C727 126 793 121 870 79C952 34 1017 54 1087 90C1166 130 1235 126 1313 88C1396 47 1471 55 1600 92V260H0Z"
      />
      <path
        fill="currentColor"
        opacity="0.42"
        d="M0 58C90 20 156 42 238 63C325 85 399 91 468 49C545 2 624 27 701 62C784 99 850 92 923 55C1005 13 1075 29 1152 66C1234 105 1312 104 1391 69C1468 35 1531 38 1600 57V260H0Z"
      />
    </svg>
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
