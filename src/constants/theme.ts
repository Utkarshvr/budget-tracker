import { useColorScheme } from "react-native";

const darkColors = {
  // Backgrounds
  background: {
    DEFAULT: "#171717", // bg-background (neutral-900)
    subtle: "#262626", // bg-background-subtle (neutral-800)
  },

  // Foregrounds
  foreground: "#f9fafb", // text-foreground

  // Cards / surfaces
  card: {
    DEFAULT: "#020617", // bg-card
    foreground: "#f9fafb", // text-card-foreground
  },

  // Muted text / surfaces
  muted: {
    DEFAULT: "#111827", // bg-muted
    foreground: "#9ca3af", // text-muted-foreground
  },

  // Primary / accent
  primary: {
    DEFAULT: "#22c55e", // bg-primary, text-primary
    foreground: "#022c22", // text-primary-foreground
    soft: "rgba(34, 197, 94, 0.15)", // bg-primary-soft
    border: "rgba(34, 197, 94, 0.3)", // border-primary-border
    strong: "#16a34a", // bg-primary-strong
  },

  // Generic borders / inputs / focus
  border: "#1f2937",
  input: "#111827",
  ring: "#22c55e",

  // Status colors
  destructive: {
    DEFAULT: "#ef4444",
    foreground: "#fef2f2",
  },
  success: {
    DEFAULT: "#16a34a",
    foreground: "#dcfce7",
  },
  warning: {
    DEFAULT: "#f59e0b",
    foreground: "#fffbeb",
  },

  // Domain-specific colors
  transaction: {
    expense: {
      badgeBg: "#7f1d1d",
      badgeIcon: "#fca5a5",
      amountClass: "text-red-400",
    },
    income: {
      badgeBg: "#064e3b",
      badgeIcon: "#86efac",
      amountClass: "text-green-400",
    },
    transfer: {
      badgeBg: "#1e3a8a",
      badgeIcon: "#bfdbfe",
      amountClass: "text-neutral-300",
    },
    goal: {
      badgeBg: "#4c1d95",
      badgeIcon: "#ddd6fe",
      amountClass: "text-purple-400",
    },
    goalWithdraw: {
      badgeBg: "#14532d",
      badgeIcon: "#86efac",
      amountClass: "text-green-400",
    },
  },

  // Extras for gradients / overlays
  surfaceGradient: {
    from: "#262626", // neutral-800, matches background.subtle
    to: "#171717", // neutral-900, matches background.DEFAULT
  },
  overlay: "rgba(15, 23, 42, 0.7)",
} as const;

const lightColors = {
  // Backgrounds
  background: {
    DEFAULT: "#f5f5f5", // light background (neutral-100)
    subtle: "#e5e5e5", // subtle surface (neutral-200)
  },

  // Foregrounds
  foreground: "#020617", // near-black text

  // Cards / surfaces
  card: {
    DEFAULT: "#ffffff", // white cards
    foreground: "#020617",
  },

  // Muted text / surfaces
  muted: {
    DEFAULT: "#e5e7eb", // muted surface
    foreground: "#6b7280", // muted text
  },

  // Primary / accent (same brand color)
  primary: {
    DEFAULT: "#22c55e",
    foreground: "#052e16",
    soft: "rgba(34, 197, 94, 0.12)",
    border: "rgba(34, 197, 94, 0.3)",
    strong: "#16a34a",
  },

  // Generic borders / inputs / focus
  border: "#e5e7eb",
  input: "#ffffff",
  ring: "#22c55e",

  // Status colors (same hues, tuned for light bg)
  destructive: {
    DEFAULT: "#b91c1c",
    foreground: "#fef2f2",
  },
  success: {
    DEFAULT: "#16a34a",
    foreground: "#052e16",
  },
  warning: {
    DEFAULT: "#f59e0b",
    foreground: "#78350f",
  },

  // Domain-specific colors (keep transaction look consistent)
  transaction: {
    expense: {
      badgeBg: "#fef2f2",
      badgeIcon: "#b91c1c",
      amountClass: "text-red-500",
    },
    income: {
      badgeBg: "#ecfdf3",
      badgeIcon: "#16a34a",
      amountClass: "text-green-600",
    },
    transfer: {
      badgeBg: "#eff6ff",
      badgeIcon: "#1d4ed8",
      amountClass: "text-slate-900",
    },
    goal: {
      badgeBg: "#f5f3ff",
      badgeIcon: "#7c3aed",
      amountClass: "text-purple-600",
    },
    goalWithdraw: {
      badgeBg: "#ecfdf3",
      badgeIcon: "#16a34a",
      amountClass: "text-green-600",
    },
  },

  // Extras for gradients / overlays
  surfaceGradient: {
    from: "#ffffff",
    to: "#e5e7eb",
  },
  overlay: "rgba(15, 23, 42, 0.35)",
} as const;

export const darkTheme = { colors: darkColors };
export const lightTheme = { colors: lightColors };

// Default export used in most of the app today (dark-first)
export const theme = darkTheme;

export type ThemeColors = typeof darkColors;

export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "light" ? lightColors : darkColors;
}
