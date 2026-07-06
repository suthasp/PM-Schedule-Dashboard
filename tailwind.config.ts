import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          light: "#fcfcfb",
          dark: "#1a1a19",
        },
        page: {
          light: "#f9f9f7",
          dark: "#0d0d0d",
        },
        accent: {
          DEFAULT: "#2a78d6",
          dark: "#3987e5",
        },
        status: {
          completed: "#0ca30c",
          pending: "#fab219",
          overdue: "#d03b3b",
          progress: "#2a78d6",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(11,11,11,0.04), 0 4px 16px rgba(11,11,11,0.06)",
        "soft-lg": "0 2px 4px rgba(11,11,11,0.05), 0 8px 28px rgba(11,11,11,0.09)",
      },
      borderRadius: {
        card: "1rem",
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
