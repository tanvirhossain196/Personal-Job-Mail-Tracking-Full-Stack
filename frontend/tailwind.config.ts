import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0F17",
          800: "#121826",
          700: "#1A2233",
        },
        steel: {
          900: "#1B2430",
          700: "#2E3B4E",
          500: "#556278",
          300: "#8B97A8",
          100: "#D7DCE3",
        },
        fog: {
          50: "#F5F6F9",
          100: "#EBEEF2",
        },
        signal: {
          DEFAULT: "#E08A2B",
          600: "#C6740F",
          100: "#FCEAD3",
        },
        circuit: {
          DEFAULT: "#3466A6",
          600: "#25507F",
          100: "#DEEAF5",
        },
        success: {
          DEFAULT: "#2F7D4F",
          600: "#256640",
          700: "#1F5C39",
          100: "#DEF0E4",
        },
        danger: {
          DEFAULT: "#B3402F",
          700: "#7E2C20",
          100: "#F6DFDA",
        },
        warning: {
          DEFAULT: "#C98A1B",
          700: "#8C6313",
          100: "#F6E7CC",
        },
        violet: {
          DEFAULT: "#6E56CF",
          700: "#4C3999",
          100: "#EAE4FB",
        },
        teal: {
          DEFAULT: "#0E9488",
          700: "#0B6F66",
          100: "#D9F2EF",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 2px rgba(16, 21, 28, 0.06), 0 1px 0 rgba(16, 21, 28, 0.04)",
        rivet: "inset 0 1px 0 rgba(255,255,255,0.06)",
        float: "0 8px 24px rgba(16, 21, 28, 0.10), 0 2px 6px rgba(16, 21, 28, 0.06)",
      },
      borderRadius: {
        sm: "4px",
        md: "6px",
        lg: "10px",
        xl: "14px",
      },
      backgroundImage: {
        blueprint:
          "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};

export default config;
