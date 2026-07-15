/**
 * Terminal theme system with 51 tokens and hot-reload.
 *
 * Loads theme JSON files from `~/.trumbo/themes/*.json` and maps them to
 * the existing palette system. Built-in themes (dark, light, dracula, nord,
 * solarized) are provided as defaults.
 *
 * Theme file format:
 * ```json
 * {
 *   "name": "My Theme",
 *   "background": "#1e1e2e",
 *   "foreground": "#cdd6f4",
 *   "brand": "#89b4fa",
 *   "selection": "#89b4fa",
 *   "textOnSelection": "#1e1e2e",
 *   ...
 * }
 * ```
 */

import { EventEmitter } from "node:events";
import { existsSync, readdirSync, readFileSync, watch } from "node:fs";
import { join } from "node:path";
import { resolveTrumboDir } from "@trumbodev/shared/storage";

/** 51-token theme schema */
export interface ThemeTokens {
	// Surface (8 tokens)
	background: string;
	foreground: string;
	surface: string;
	surfaceBright: string;
	surfaceDim: string;
	border: string;
	borderStrong: string;
	selection: string;

	// Text on surfaces (4 tokens)
	textOnSelection: string;
	textOnPrimary: string;
	textOnSecondary: string;
	textMuted: string;

	// Brand + mode (4 tokens)
	brand: string;
	brandBright: string;
	act: string;
	plan: string;

	// Status (4 tokens)
	success: string;
	error: string;
	warning: string;
	info: string;

	// Syntax (12 tokens)
	syntaxKeyword: string;
	syntaxString: string;
	syntaxNumber: string;
	syntaxComment: string;
	syntaxFunction: string;
	syntaxVariable: string;
	syntaxType: string;
	syntaxConstant: string;
	syntaxOperator: string;
	syntaxPunctuation: string;
	syntaxTag: string;
	syntaxAttribute: string;

	// Diff (6 tokens)
	diffAddedBg: string;
	diffRemovedBg: string;
	diffAddedFg: string;
	diffRemovedFg: string;
	diffAddedSign: string;
	diffRemovedSign: string;

	// Thinking levels (4 tokens)
	thinkingNone: string;
	thinkingLow: string;
	thinkingMedium: string;
	thinkingHigh: string;

	// Accents (5 tokens)
	accent1: string;
	accent2: string;
	accent3: string;
	accent4: string;
	accent5: string;

	// Misc (4 tokens)
	link: string;
	linkHover: string;
	cursor: string;
	dim: string;
}

export interface Theme {
	name: string;
	tokens: ThemeTokens;
}

/** Built-in dark theme */
export const BUILTIN_DARK: ThemeTokens = {
	background: "#000000",
	foreground: "#e0e0e0",
	surface: "#1a1a1a",
	surfaceBright: "#2a2a2a",
	surfaceDim: "#0a0a0a",
	border: "#333333",
	borderStrong: "#555555",
	selection: "#2BBF77",
	textOnSelection: "#000000",
	textOnPrimary: "#ffffff",
	textOnSecondary: "#cccccc",
	textMuted: "#888888",
	brand: "#2BBF77",
	brandBright: "#3dd686",
	act: "#2BBF77",
	plan: "#f0c040",
	success: "#22c55e",
	error: "#ef4444",
	warning: "#f59e0b",
	info: "#3b82f6",
	syntaxKeyword: "#c678dd",
	syntaxString: "#98c379",
	syntaxNumber: "#d19a66",
	syntaxComment: "#7f7f7f",
	syntaxFunction: "#61afef",
	syntaxVariable: "#e06c75",
	syntaxType: "#e5c07b",
	syntaxConstant: "#d19a66",
	syntaxOperator: "#56b6c2",
	syntaxPunctuation: "#abb2bf",
	syntaxTag: "#e06c75",
	syntaxAttribute: "#d19a66",
	diffAddedBg: "#1a4d1a",
	diffRemovedBg: "#4d1a1a",
	diffAddedFg: "#22c55e",
	diffRemovedFg: "#ef4444",
	diffAddedSign: "#22c55e",
	diffRemovedSign: "#ef4444",
	thinkingNone: "#555555",
	thinkingLow: "#3b82f6",
	thinkingMedium: "#f59e0b",
	thinkingHigh: "#ef4444",
	accent1: "#2BBF77",
	accent2: "#3b82f6",
	accent3: "#f59e0b",
	accent4: "#ef4444",
	accent5: "#a855f7",
	link: "#3b82f6",
	linkHover: "#60a5fa",
	cursor: "#2BBF77",
	dim: "#555555",
};

/** Built-in light theme */
export const BUILTIN_LIGHT: ThemeTokens = {
	...BUILTIN_DARK,
	background: "#ffffff",
	foreground: "#1a1a1a",
	surface: "#f5f5f5",
	surfaceBright: "#ffffff",
	surfaceDim: "#e0e0e0",
	border: "#d0d0d0",
	borderStrong: "#a0a0a0",
	selection: "#15803d",
	textOnSelection: "#ffffff",
	textOnPrimary: "#000000",
	textOnSecondary: "#333333",
	textMuted: "#666666",
	brand: "#15803d",
	brandBright: "#116329",
	act: "#15803d",
	plan: "#9a6700",
	success: "#116329",
	error: "#b42318",
	warning: "#b45309",
	info: "#1d4ed8",
	diffAddedBg: "#e6ffed",
	diffRemovedBg: "#ffebe9",
	diffAddedFg: "#116329",
	diffRemovedFg: "#b42318",
	diffAddedSign: "#116329",
	diffRemovedSign: "#b42318",
};

/** Built-in Dracula theme */
export const BUILTIN_DRACULA: ThemeTokens = {
	...BUILTIN_DARK,
	background: "#282a36",
	foreground: "#f8f8f2",
	surface: "#383a4a",
	surfaceBright: "#44475a",
	surfaceDim: "#21222c",
	border: "#44475a",
	borderStrong: "#6272a4",
	selection: "#bd93f9",
	textOnSelection: "#282a36",
	brand: "#bd93f9",
	brandBright: "#caa9fa",
	act: "#bd93f9",
	plan: "#f1fa8c",
	success: "#50fa7b",
	error: "#ff5555",
	warning: "#ffb86c",
	info: "#8be9fd",
	syntaxKeyword: "#ff79c6",
	syntaxString: "#f1fa8c",
	syntaxNumber: "#bd93f9",
	syntaxComment: "#6272a4",
	syntaxFunction: "#8be9fd",
	syntaxVariable: "#f8f8f2",
	syntaxType: "#8be9fd",
	syntaxConstant: "#bd93f9",
	syntaxOperator: "#ff79c6",
	syntaxPunctuation: "#f8f8f2",
	diffAddedBg: "#1a3a1a",
	diffRemovedBg: "#3a1a1a",
	thinkingLow: "#8be9fd",
	thinkingMedium: "#ffb86c",
	thinkingHigh: "#ff5555",
	accent1: "#bd93f9",
	accent2: "#8be9fd",
	accent3: "#ffb86c",
	accent4: "#ff5555",
	accent5: "#ff79c6",
	cursor: "#bd93f9",
};

/** Built-in Nord theme */
export const BUILTIN_NORD: ThemeTokens = {
	...BUILTIN_DARK,
	background: "#2e3440",
	foreground: "#d8dee9",
	surface: "#3b4252",
	surfaceBright: "#434c5e",
	surfaceDim: "#292e39",
	border: "#434c5e",
	borderStrong: "#4c566a",
	selection: "#88c0d0",
	textOnSelection: "#2e3440",
	brand: "#88c0d0",
	brandBright: "#8fbcbb",
	act: "#88c0d0",
	plan: "#ebcb8b",
	success: "#a3be8c",
	error: "#bf616a",
	warning: "#ebcb8b",
	info: "#81a1c1",
	syntaxKeyword: "#81a1c1",
	syntaxString: "#a3be8c",
	syntaxNumber: "#b48ead",
	syntaxComment: "#616e88",
	syntaxFunction: "#88c0d0",
	syntaxVariable: "#d8dee9",
	syntaxType: "#8fbc8b",
	diffAddedBg: "#1a2a1a",
	diffRemovedBg: "#2a1a1a",
	thinkingLow: "#81a1c1",
	thinkingMedium: "#ebcb8b",
	thinkingHigh: "#bf616a",
	accent1: "#88c0d0",
	accent2: "#81a1c1",
	accent3: "#ebcb8b",
	accent4: "#bf616a",
	accent5: "#b48ead",
	cursor: "#88c0d0",
};

/** Built-in Solarized Dark theme */
export const BUILTIN_SOLARIZED: ThemeTokens = {
	...BUILTIN_DARK,
	background: "#002b36",
	foreground: "#839496",
	surface: "#073642",
	surfaceBright: "#094858",
	surfaceDim: "#001e26",
	border: "#073642",
	borderStrong: "#136a7a",
	selection: "#2aa198",
	textOnSelection: "#002b36",
	brand: "#2aa198",
	brandBright: "#3bb0ad",
	act: "#2aa198",
	plan: "#b58900",
	success: "#859900",
	error: "#dc322f",
	warning: "#b58900",
	info: "#268bd2",
	syntaxKeyword: "#859900",
	syntaxString: "#2aa198",
	syntaxNumber: "#d33682",
	syntaxComment: "#586e75",
	syntaxFunction: "#268bd2",
	syntaxVariable: "#cb4b16",
	syntaxType: "#b58900",
	diffAddedBg: "#073642",
	diffRemovedBg: "#362112",
	thinkingLow: "#268bd2",
	thinkingMedium: "#b58900",
	thinkingHigh: "#dc322f",
	accent1: "#2aa198",
	accent2: "#268bd2",
	accent3: "#b58900",
	accent4: "#dc322f",
	accent5: "#d33682",
	cursor: "#2aa198",
};

/** All built-in themes */
export const BUILTIN_THEMES: Record<string, Theme> = {
	dark: { name: "Dark", tokens: BUILTIN_DARK },
	light: { name: "Light", tokens: BUILTIN_LIGHT },
	dracula: { name: "Dracula", tokens: BUILTIN_DRACULA },
	nord: { name: "Nord", tokens: BUILTIN_NORD },
	solarized: { name: "Solarized Dark", tokens: BUILTIN_SOLARIZED },
};

/**
 * Load all available themes: built-in + user themes from ~/.trumbo/themes/.
 *
 * User themes override built-in themes with the same key.
 */
export function loadThemes(): Record<string, Theme> {
	const themes: Record<string, Theme> = { ...BUILTIN_THEMES };

	const themesDir = join(resolveTrumboDir(), "themes");
	if (!existsSync(themesDir)) {
		return themes;
	}

	try {
		const files = readdirSync(themesDir).filter((f) => f.endsWith(".json"));
		for (const file of files) {
			try {
				const raw = readFileSync(join(themesDir, file), "utf8");
				const parsed = JSON.parse(raw) as Partial<ThemeTokens> & {
					name?: string;
				};
				const key = file.replace(/\.json$/, "");
				themes[key] = {
					name: parsed.name ?? key,
					tokens: { ...BUILTIN_DARK, ...parsed } as ThemeTokens,
				};
			} catch {
				// Skip invalid theme files
			}
		}
	} catch {
		// Skip if directory read fails
	}

	return themes;
}

/**
 * Get the active theme by key, falling back to dark.
 */
export function getTheme(
	themes: Record<string, Theme>,
	themeKey: string,
): Theme {
	return themes[themeKey] ?? themes.dark ?? BUILTIN_THEMES.dark;
}

/**
 * Map a ThemeTokens to the legacy palette format for backward compatibility.
 */
export function themeToPalette(tokens: ThemeTokens) {
	return {
		brand: tokens.brand,
		act: tokens.act,
		plan: tokens.plan,
		selection: tokens.selection,
		success: tokens.success,
		error: tokens.error,
		muted: tokens.textMuted,
		dim: tokens.dim,
		textOnSelection: tokens.textOnSelection,
		border: tokens.border,
		borderStrong: tokens.borderStrong,
	} as const;
}

// --- Cached loader + hot-reload ---------------------------------------------
// loadThemes() hits the filesystem; callers during render should use
// getCachedThemes(). A file watcher on ~/.trumbo/themes/ clears the cache and
// emits "change" so the TUI can re-render with the new theme.

let cachedThemes: Record<string, Theme> | undefined;
const themeEmitter = new EventEmitter();
let watcherStarted = false;

/** Load themes once and cache the result. Use this in render paths. */
export function getCachedThemes(): Record<string, Theme> {
	if (!cachedThemes) {
		cachedThemes = loadThemes();
	}
	return cachedThemes;
}

/** Clear the theme cache and notify subscribers that the theme set changed. */
export function clearThemeCache(): void {
	cachedThemes = undefined;
	themeEmitter.emit("change");
}

/** Subscribe to theme-set changes (e.g. a theme file was added/edited). */
export function subscribeThemeChanges(cb: () => void): () => void {
	themeEmitter.on("change", cb);
	return () => {
		themeEmitter.off("change", cb);
	};
}

/**
 * Start watching ~/.trumbo/themes/ for changes. Safe to call multiple times.
 * On any change the theme cache is cleared and subscribers are notified.
 */
export function startThemeWatcher(): void {
	if (watcherStarted) return;
	watcherStarted = true;
	const themesDir = join(resolveTrumboDir(), "themes");
	if (!existsSync(themesDir)) return;
	try {
		const watcher = watch(themesDir, () => {
			clearThemeCache();
		});
		watcher.on("error", () => {
			// Ignore watcher errors (dir deleted, etc.) — best-effort.
		});
	} catch {
		// Watch unavailable (platform/permissions) — hot-reload disabled.
	}
}
