import type { Config } from "tailwindcss";

/**
 * Colour tokens are RGB channel triplets in `globals.css`, referenced here
 * through the `<alpha-value>` placeholder. Tailwind substitutes the opacity
 * from the utility, so `bg-primary/10` becomes `rgb(var(--primary) / 0.1)`.
 *
 * Handing Tailwind a bare `var(--primary)` instead looks like it works, but
 * every opacity modifier is then silently dropped from the stylesheet — no
 * rule, no warning, and the element quietly inherits some other colour.
 */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: token("background"),
        foreground: token("foreground"),
        primary: {
          DEFAULT: token("primary"),
          foreground: token("primary-foreground"),
          deep: token("primary-deep"),
        },
        secondary: {
          DEFAULT: token("secondary"),
          foreground: token("secondary-foreground"),
        },
        accent: {
          DEFAULT: token("accent"),
          foreground: token("accent-foreground"),
        },
        muted: {
          DEFAULT: token("muted"),
          foreground: token("muted-foreground"),
        },
        border: token("border"),
        gold: {
          DEFAULT: token("gold"),
          light: token("gold-light"),
          ink: token("gold-ink"),
        },
        ivory: token("ivory"),
        ink: token("secondary"),
        success: token("success"),
        warning: token("warning"),
        danger: token("danger"),
      },
      borderRadius: {
        pill: "var(--r-pill)",
        card: "var(--r-card)",
        control: "var(--r-control)",
        sm: "var(--r-sm)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        hover: "var(--shadow-hover)",
        gold: "var(--shadow-gold)",
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        // Wider than the old 1280 so the hero copy sits nearer the
        // edge instead of floating in a narrow column.
        content: "1440px",
      },
    },
  },
  plugins: [],
};

export default config;
