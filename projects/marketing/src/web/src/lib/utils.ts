import { cn as kumoCn } from "@cloudflare/kumo";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return kumoCn(twMerge(clsx(inputs)));
}

/** Capitalize the first letter of each word (preserves existing caps, e.g. CLI, Trumbo). */
export function titleCase(text: string): string {
	return text.replace(/\b([a-z])/g, (match) => match.toUpperCase());
}
