/**
 * Utility function to merge class names
 * Simple version for NativeWind - just joins strings with spaces
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

