import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "var(--ink)",
          2: "var(--ink2)",
          3: "var(--ink3)",
          4: "var(--ink4)",
        },
        gold: {
          DEFAULT: "var(--gold)",
          2: "var(--gold2)",
          dim: "var(--gold-dim)",
        },
        teal: {
          DEFAULT: "var(--teal)",
          2: "var(--teal2)",
          dim: "var(--teal-dim)",
        },
        cream: {
          DEFAULT: "var(--cream)",
          2: "var(--cream2)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          2: "var(--muted2)",
        },
        red: {
          DEFAULT: "var(--red)",
          dim: "var(--red-dim)",
        },
        border: {
          DEFAULT: "var(--border)",
          2: "var(--border2)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        "display-xl": ["clamp(4rem, 9rem, 9rem)", { lineHeight: "0.88" }],
        "display-lg": ["4.5rem", { lineHeight: "0.9" }],
        "display-md": ["3rem", { lineHeight: "0.92" }],
        "display-sm": ["2rem", { lineHeight: "0.95" }],
      },
      borderRadius: {
        DEFAULT: "1px",
        lg: "2px",
        xl: "4px",
      },
      animation: {
        "glow-pulse": "glow-pulse 2.8s ease-in-out infinite",
        "float-up": "float-up 700ms ease-out both",
        scan: "scan 2.4s linear infinite",
        "anon-pulse": "anon-pulse 1.8s ease-in-out infinite",
        "scroll-drop": "scroll-drop 1.6s ease-in-out infinite",
        shimmer: "shimmer 2.2s ease-in-out infinite",
        "fade-up": "fade-up 520ms ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
