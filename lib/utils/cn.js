import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names intelligently.
 * Resolves conflicts so only the last conflicting class applies.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
