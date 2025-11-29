/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Raw brand palette (not used directly in classes, but available if needed)
        brand: {
          DEFAULT: "#22c55e",
          light: "#4ade80",
          dark: "#16a34a",
        },

        // App semantic colors (inspired by modern design systems / shadcn)
        background: {
          DEFAULT: "#171717", // page background (neutral-900)
          subtle: "#262626",  // slightly lifted areas (neutral-800)
        },
        foreground: "#f9fafb", // primary text on dark background (slate-50)

        card: {
          DEFAULT: "#020617", // card background
          foreground: "#f9fafb",
        },

        muted: {
          DEFAULT: "#111827", // muted surfaces / chips
          foreground: "#9ca3af", // muted text (neutral-400)
        },

        primary: {
          DEFAULT: "#22c55e", // main action color (green-500)
          foreground: "#022c22", // text/icon on primary
          soft: "rgba(34, 197, 94, 0.15)", // subtle primary background
          border: "rgba(34, 197, 94, 0.3)", // soft primary border
          strong: "#16a34a", // stronger primary state (green-600)
        },

        border: "#1f2937", // card/border outlines (slate-800)
        input: "#111827", // input backgrounds (slate-900)
        ring: "#22c55e", // focus ring / selection

        destructive: {
          DEFAULT: "#ef4444", // red-500
          foreground: "#fef2f2", // red-50
        },

        success: {
          DEFAULT: "#16a34a", // green-600
          foreground: "#dcfce7", // green-50
        },

        warning: {
          DEFAULT: "#f59e0b", // amber-500
          foreground: "#fffbeb", // amber-50
        },
      },
    },
  },
  plugins: [],
};
