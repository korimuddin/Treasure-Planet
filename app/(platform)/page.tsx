"use client";

import Link from "next/link";
import type { CSSProperties } from "react";

type Particle = {
  id: number;
  left: number;
  top: number;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  color: string;
  drift: number;
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
const particles: Particle[] = Array.from({ length: 44 }, (_, index) => {
  const teal = index % 4 === 0;

  return {
    id: index,
    left: (index * 23 + 7) % 100,
    top: (index * 31 + 11) % 100,
    delay: (index * 0.31) % 12,
    duration: 16 + (index % 9),
    size: index % 7 === 0 ? 5 : 1.5 + (index % 4),
    opacity: 0.08 + ((index % 6) * 0.026),
    color: teal ? "159,197,255" : "255,255,255",
    drift: (index % 2 === 0 ? 1 : -1) * (12 + (index % 8) * 4),
  };
});

export default function HomePage() {
  return (
    <main className="relative isolate overflow-hidden bg-ink">
      <Atmosphere particles={particles} />

      <section className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8">
        <div aria-hidden="true" className="absolute left-0 right-0 top-20 h-px bg-[linear-gradient(90deg,transparent,rgba(234,243,255,0.34),transparent)]" />
        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-px bg-[linear-gradient(90deg,transparent,rgba(117,170,255,0.28),transparent)]" />

        <MarkerRail values={depthMarkers} side="left" />
        <MarkerRail values={coordinateMarkers} side="right" />

        <div className="mx-auto max-w-4xl">
          <div className="absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[50rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(2,7,18,0.58),rgba(2,7,18,0.36)_42%,transparent_72%)] blur-2xl" />
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
            className="royal-gradient-text mt-2 font-display text-[clamp(4rem,16vw,8rem)] uppercase leading-[0.85] opacity-0 [animation:fade-up_700ms_ease_forwards]"
            style={{
              animationDelay: "0.45s",
              textShadow: "0 0 26px rgba(117,170,255,0.28), 0 0 72px rgba(14,95,255,0.18)",
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
              className="btn-liquid inline-flex items-center gap-3 border-border2 px-6 py-4 font-mono text-xs uppercase tracking-[0.18em] text-cream"
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_110%_52%_at_50%_-12%,rgba(109,140,255,0.58),transparent_62%),radial-gradient(ellipse_72%_38%_at_12%_26%,rgba(127,176,255,0.16),transparent_58%),radial-gradient(ellipse_64%_42%_at_86%_34%,rgba(14,95,255,0.22),transparent_58%),radial-gradient(ellipse_90%_58%_at_50%_78%,rgba(2,7,18,0.10),rgba(2,7,18,0.88)_72%),linear-gradient(180deg,#050b2b_0%,#08245d_28%,#061633_62%,#020712_100%)]" />
      <WaterWaves />
      <LightShafts />
      <OceanFog />
      <DepthSetPiece />
      <div className="absolute left-[6%] top-[28%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(117,170,255,0.18),transparent_70%)] blur-sm [animation:glow-pulse_9s_ease-in-out_infinite]" />
      <div className="absolute right-[10%] top-[40%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(14,95,255,0.16),transparent_72%)] blur-md [animation:glow-pulse_12s_ease-in-out_infinite]" />
      <div className="absolute bottom-[12%] left-[44%] h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(159,197,255,0.11),transparent_72%)] blur-sm [animation:glow-pulse_7s_ease-in-out_infinite]" />
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="absolute rounded-full border border-white/10 bg-white/20 shadow-[0_0_18px_rgba(159,197,255,0.22)]"
          style={{
            left: `${particle.left}%`,
            top: `${particle.top}%`,
            width: particle.size,
            height: particle.size,
            opacity: particle.opacity,
            backgroundColor: `rgba(${particle.color},${particle.opacity})`,
            animation: `bubble-rise ${particle.duration}s ease-in-out infinite`,
            animationDelay: `${particle.delay}s`,
            "--bubble-drift": `${particle.drift}px`,
          } as CSSProperties & {
            "--bubble-drift": string;
          }}
        />
      ))}
      <div className="absolute left-0 right-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(234,243,255,0.46),transparent)] [animation:scan_5s_linear_infinite]" />
      <svg
        className="absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 text-white opacity-[0.026] [animation:compass-rotate_120s_linear_infinite]"
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
      <div className="absolute inset-x-0 top-0 h-[46vh] bg-[linear-gradient(180deg,rgba(126,149,255,0.34),rgba(43,112,255,0.18)_34%,transparent_100%)]" />
      <div className="absolute inset-x-[-6%] top-[4vh] h-[35vh] opacity-80 blur-[0.7px] [animation:wave-swell_14s_ease-in-out_infinite]">
        <WaveBand className="text-[#294bb4] opacity-[0.36] [animation:wave-drift_18s_ease-in-out_infinite_alternate]" yOffset={0} />
        <WaveBand className="top-[4rem] text-[#12367e] opacity-[0.46] [animation:wave-drift_24s_ease-in-out_infinite_alternate-reverse]" yOffset={24} />
        <WaveBand className="top-[8.5rem] text-[#061b49] opacity-[0.74] [animation:wave-drift_31s_ease-in-out_infinite_alternate]" yOffset={54} />
      </div>
      <div className="absolute inset-x-[-22%] top-[10vh] h-[76vh] opacity-[0.28] mix-blend-screen blur-xl [background-image:linear-gradient(112deg,transparent_0%,transparent_38%,rgba(151,180,255,0.26)_46%,transparent_56%,transparent_100%),linear-gradient(68deg,transparent_0%,transparent_36%,rgba(159,197,255,0.16)_44%,transparent_54%,transparent_100%)] [background-size:48rem_100%,62rem_100%] [mask-image:linear-gradient(180deg,transparent,black_12%,black_68%,transparent)] [animation:water-shimmer_24s_linear_infinite]" />
      <div className="absolute inset-x-[-10%] top-[9vh] h-[32vh] opacity-[0.24] mix-blend-screen [background-image:radial-gradient(ellipse_at_center,rgba(255,255,255,0.26)_0_1px,transparent_1px_20px)] [background-size:6.5rem_2.7rem] [transform:perspective(560px)_rotateX(60deg)] [animation:caustic-drift_20s_linear_infinite]" />
      <div className="absolute inset-x-0 top-[24vh] h-[62vh] bg-[radial-gradient(ellipse_70%_40%_at_50%_0%,rgba(117,170,255,0.16),transparent_68%)] opacity-80" />
    </div>
  );
}

function LightShafts() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-75">
      {[10, 25, 43, 61, 79, 91].map((left, index) => (
        <span
          key={left}
          className="absolute top-[-12vh] h-[96vh] w-24 origin-top -skew-x-12 bg-[linear-gradient(180deg,rgba(234,243,255,0.15),rgba(117,170,255,0.045)_44%,transparent)] blur-md [mask-image:linear-gradient(180deg,black,transparent_86%)] [animation:shaft-sway_13s_ease-in-out_infinite_alternate]"
          style={{
            left: `${left}%`,
            animationDelay: `${index * -1.8}s`,
          }}
        />
      ))}
      <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(ellipse_70%_80%_at_50%_0%,rgba(234,243,255,0.20),transparent_70%)]" />
    </div>
  );
}

function OceanFog() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-[-20%] top-[34%] h-40 bg-[linear-gradient(90deg,transparent,rgba(159,197,255,0.08),transparent)] blur-3xl [animation:fog-drift_26s_ease-in-out_infinite_alternate]" />
      <div className="absolute inset-x-[-20%] top-[58%] h-52 bg-[linear-gradient(90deg,transparent,rgba(14,95,255,0.10),transparent)] blur-3xl [animation:fog-drift_34s_ease-in-out_infinite_alternate-reverse]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,rgba(2,7,18,0.16)_42%,rgba(2,7,18,0.54)_100%)]" />
    </div>
  );
}

function DepthSetPiece() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-[36vh] overflow-hidden">
      <svg className="absolute bottom-[-1px] left-0 h-full w-full text-[#010816] opacity-95" viewBox="0 0 1600 360" preserveAspectRatio="none">
        <path
          fill="currentColor"
          d="M0 300C132 250 238 255 341 282C438 307 521 320 642 283C739 254 842 250 946 286C1060 326 1160 326 1282 287C1400 249 1500 259 1600 294V360H0Z"
        />
        <path
          fill="currentColor"
          opacity="0.62"
          d="M0 330C170 294 296 311 416 322C552 334 664 312 790 299C939 283 1056 307 1198 324C1327 340 1450 326 1600 309V360H0Z"
        />
      </svg>
      <svg className="absolute bottom-[7vh] left-[9%] h-36 w-72 rotate-[-7deg] text-[#75aaff] opacity-[0.16]" viewBox="0 0 360 160" fill="none">
        <path d="M38 112C96 89 170 86 262 100L321 109C278 137 210 151 125 145C84 142 54 132 38 112Z" fill="currentColor" opacity="0.22" />
        <path d="M82 95L96 42M143 89L156 28M212 93L230 47" stroke="currentColor" strokeWidth="2" opacity="0.45" />
        <circle cx="92" cy="42" r="19" stroke="currentColor" strokeWidth="2" opacity="0.32" />
        <path d="M60 112C128 101 220 103 310 119" stroke="currentColor" strokeWidth="2" opacity="0.42" />
      </svg>
      <div className="absolute bottom-[9vh] right-[16%] h-2 w-2 rounded-full bg-white shadow-[0_0_28px_10px_rgba(117,170,255,0.34)] [animation:beacon-pulse_4.2s_ease-in-out_infinite]" />
      <div className="absolute bottom-[7.5vh] right-[13%] h-12 w-28 border border-white/10 bg-[rgba(117,170,255,0.07)] opacity-[0.28]" />
      <div className="absolute bottom-[12vh] right-[11%] h-20 w-px rotate-[-16deg] bg-white/10" />
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
