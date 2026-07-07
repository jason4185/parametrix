import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#0D1B1E",
        "accent-foreground": "#F8FAFC",
        base: "#071013",
        background: "#071013",
        border: "rgba(255,255,255,0.12)",
        card: "#0D1B1E",
        "card-foreground": "#F8FAFC",
        cyan: "#00E5FF",
        destructive: "#FF4D5E",
        foreground: "#F8FAFC",
        input: "rgba(255,255,255,0.14)",
        muted: "#94A3B8",
        "muted-foreground": "#94A3B8",
        popover: "#0D1B1E",
        "popover-foreground": "#F8FAFC",
        primary: "#00E5FF",
        "primary-foreground": "#071013",
        ring: "#00E5FF",
        secondary: "#0D1B1E",
        "secondary-foreground": "#F8FAFC",
        aqua: "#00FFC6",
        lime: "#B8FF2C",
        amber: "#FFB020",
        coral: "#FF4D5E",
        text: "#F8FAFC",
      },
      boxShadow: {
        cyan: "0 0 24px rgba(0, 229, 255, 0.2)",
      },
      backgroundImage: {
        "signal-grid":
          "linear-gradient(rgba(0, 229, 255, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.08) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
