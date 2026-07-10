import {
	BUILTIN_DARK,
	BUILTIN_LIGHT,
	getCachedThemes,
	subscribeThemeChanges,
	themeToPalette,
} from "./utils/themes";

// Trumbo terminal palette.
//
// `palette` holds the dark-terminal token set using ANSI named colors so the
// renderer can map them to the user's actual terminal palette. The themed
// accents (brand/act/plan/success + role colors) are resolved at runtime by
// `resolveThemePalette()` from the 51-token theme system (utils/themes.ts),
// which honors a `TRUMBO_THEME` env override and falls back to the detected
// dark/light built-in theme. `spacing` is a tiny shared rhythm scale.
export const palette = {
	// Brand + mode accents
	brand: "green",
	act: "green",
	plan: "yellow",
	selection: "green",
	success: "brightGreen",
	error: "red",
	// Muted surface text
	muted: "gray",
	dim: "gray",
	// Text drawn on top of the selection background
	textOnSelection: "black",
	// Surface borders (theme-agnostic dark grays; light terminals render them
	// dimmer automatically)
	border: "#333333",
	borderStrong: "#555555",
	// Role + magic accents for the redesigned chat surface. ANSI defaults let
	// the terminal map them to the user's palette; hex overrides below tune
	// contrast on light terminals.
	user: "blue",
	magic: "magenta",
	tool: "yellow",
} as const;

// Spacing scale in terminal cells. Use these instead of ad-hoc margin numbers
// so the vertical rhythm stays consistent across views.
export const spacing = {
	xs: 0,
	sm: 1,
	md: 1,
	lg: 2,
	xl: 3,
} as const;

export type TerminalTheme = "dark" | "light";

export const themePalette = {
	dark: {
		brand: palette.brand,
		act: palette.act,
		plan: palette.plan,
		success: palette.success,
		user: "#5fb3f5",
		magic: "#b794f4",
		tool: "#e0af68",
	},
	light: {
		brand: "#15803d",
		act: "#15803d",
		plan: "#9a6700",
		success: "#116329",
		user: "#2563eb",
		magic: "#7c3aed",
		tool: "#b45309",
	},
} as const;

export const diffPalettes = {
	dark: {
		addedBg: "#1a4d1a",
		removedBg: "#4d1a1a",
		addedLineNumberBg: "#1a4d1a",
		removedLineNumberBg: "#4d1a1a",
		addedSignColor: "#22c55e",
		removedSignColor: "#ef4444",
		lineNumberFg: "#888888",
	},
	light: {
		addedBg: "#e6ffed",
		removedBg: "#ffebe9",
		addedLineNumberBg: "#ccf0d2",
		removedLineNumberBg: "#ffd7d5",
		addedSignColor: "#116329",
		removedSignColor: "#b42318",
		lineNumberFg: "#57606a",
	},
} as const;

/**
 * Resolve the active palette for a terminal theme. Honors a `TRUMBO_THEME`
 * env override (a key from utils/themes.ts loadThemes(), e.g. "dracula"),
 * falling back to the detected dark/light built-in theme. Role colors
 * (user/magic/tool) are preserved per terminal theme. Cached per
 * (override, theme) and invalidated when the theme set changes.
 */
export function resolveThemePalette(theme: TerminalTheme = "dark"): {
	brand: string;
	act: string;
	plan: string;
	selection: string;
	success: string;
	error: string;
	muted: string;
	dim: string;
	textOnSelection: string;
	border: string;
	borderStrong: string;
	user: string;
	magic: string;
	tool: string;
} {
	const override = process.env.TRUMBO_THEME ?? "";
	const cacheKey = `${override}:${theme}`;
	const hit = resolvePaletteCache.get(cacheKey);
	if (hit) return hit;

	const themes = getCachedThemes();
	const tokens =
		override && themes[override]
			? themes[override].tokens
			: theme === "light"
				? BUILTIN_LIGHT
				: BUILTIN_DARK;
	const resolved = {
		...themeToPalette(tokens),
		user: themePalette[theme].user,
		magic: themePalette[theme].magic,
		tool: themePalette[theme].tool,
	};
	resolvePaletteCache.set(cacheKey, resolved);
	return resolved;
}

const resolvePaletteCache = new Map<
	string,
	ReturnType<typeof resolveThemePalette>
>();

// Keep the resolved palette cache in sync with theme-file changes so
// hot-reload picks up edited/added themes.
subscribeThemeChanges(() => {
	resolvePaletteCache.clear();
});

export function getModeAccent(
	mode: string,
	theme: TerminalTheme = "dark",
): string {
	const p = resolveThemePalette(theme);
	return mode === "plan" ? p.plan : p.act;
}

export function getSuccessColor(theme: TerminalTheme = "dark"): string {
	return resolveThemePalette(theme).success;
}

export function getBrandColor(theme: TerminalTheme = "dark"): string {
	return resolveThemePalette(theme).brand;
}

export function getUserColor(theme: TerminalTheme = "dark"): string {
	return resolveThemePalette(theme).user;
}

export function getMagicColor(theme: TerminalTheme = "dark"): string {
	return resolveThemePalette(theme).magic;
}

export function getToolAccent(theme: TerminalTheme = "dark"): string {
	return resolveThemePalette(theme).tool;
}

// Input field adaptive color system
//
// The input field background needs to be visibly distinct from the terminal
// background across every theme: pure black, dark grays, tinted themes like
// Solarized/Dracula/Nord, and even light themes.
//
// We use OKLAB color space because its L (lightness) channel is perceptually
// uniform -- adding a fixed L delta produces the same visual "step" whether
// the base is black or gray, unlike raw RGB where the same numeric shift
// looks huge on dark colors and invisible on light ones.
//
// The algorithm:
//   1. Convert the terminal's detected background to OKLAB.
//   2. Compute an adaptive lift: BASE_LIFT / (1 + distance_from_extreme * DAMPING).
//      "distance_from_extreme" is L for dark themes (distance from black) or
//      1-L for light themes (distance from white). This gives a large lift on
//      very dark/light backgrounds and a smaller lift on mid-tones, preventing
//      overshoot.
//   3. On dark themes, raise L (lighten). On light themes, lower L (darken).
//   4. Nudge the a/b chromatic channels by CHROMA_NUDGE toward the mode's
//      accent color. For plan (warm/yellow): +a, +b. For act (cool/green):
//      -a, +b. At 0.003 this is ~10x below OKLAB's just-noticeable-difference
//      threshold (~0.03), so it registers as a "feel" rather than visible color.
//
// Sample outputs on common terminals (act mode / plan mode bg):
//   #000000 (black)          -> #1e201e / #211f1e  (lifted)
//   #282828 (gruvbox)        -> #494a48 / #4c4948  (lifted)
//   #002b36 (solarized dark) -> #254f58 / #2a4e58  (lifted)
//   #ffffff (white)          -> #b0b2af / #b3b0af  (darkened)
//   #fdf6e3 (solarized lite) -> #b4af9a / #b7ad9a  (darkened)
const BASE_LIFT = 0.24;
const LIFT_DAMPING = 3;
const CHROMA_NUDGE = 0.003;
const LIGHT_THEME_THRESHOLD = 0.5;

const HEX6_RE = /^#[0-9a-fA-F]{6}$/;

function normalizeHex(color: string | null): string | null {
	if (!color) return null;
	if (HEX6_RE.test(color)) return color;
	if (/^#[0-9a-fA-F]{3}$/.test(color)) {
		return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
	}
	return null;
}

function isLightTheme(terminalBg: string | null): boolean {
	const hex = normalizeHex(terminalBg);
	if (!hex) return false;
	return hexToOklab(hex).L > LIGHT_THEME_THRESHOLD;
}

export function getTerminalTheme(
	terminalBg: string | null,
	terminalFg?: string | null,
): TerminalTheme {
	const bg = normalizeHex(terminalBg);
	if (bg) {
		return hexToOklab(bg).L > LIGHT_THEME_THRESHOLD ? "light" : "dark";
	}

	const fg = normalizeHex(terminalFg ?? null);
	if (fg) {
		return hexToOklab(fg).L <= LIGHT_THEME_THRESHOLD ? "light" : "dark";
	}

	return "dark";
}

export function getDefaultForeground(
	terminalBg: string | null,
): string | undefined {
	if (!terminalBg) return undefined;
	return isLightTheme(terminalBg) ? "#1a1a1a" : undefined;
}

export function getModeInputBackground(
	mode: string,
	terminalBg: string | null,
): string {
	const hex = normalizeHex(terminalBg) ?? "#000000";
	const base = hexToOklab(hex);
	const light = base.L > LIGHT_THEME_THRESHOLD;
	const lift = BASE_LIFT / (1 + (light ? 1 - base.L : base.L) * LIFT_DAMPING);
	const warm = mode === "plan";
	return oklabToHex(
		base.L + (light ? -lift : lift),
		base.a + (warm ? CHROMA_NUDGE : -CHROMA_NUDGE),
		base.b + CHROMA_NUDGE,
	);
}

export function getModeInputForeground(
	mode: string,
	terminalBg: string | null,
): string {
	const light = isLightTheme(terminalBg);
	const base = hexToOklab(light ? "#1a1a1a" : "#f0f0f0");
	const warm = mode === "plan";
	return oklabToHex(
		base.L,
		base.a + (warm ? CHROMA_NUDGE : -CHROMA_NUDGE),
		base.b + CHROMA_NUDGE,
	);
}

export function getModeInputPlaceholder(
	mode: string,
	terminalBg: string | null,
): string {
	const light = isLightTheme(terminalBg);
	const base = hexToOklab(light ? "#777777" : "#888888");
	const warm = mode === "plan";
	return oklabToHex(
		base.L,
		base.a + (warm ? CHROMA_NUDGE * 2 : -CHROMA_NUDGE * 2),
		base.b + CHROMA_NUDGE * 2,
	);
}

function srgbToLinear(c: number): number {
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c: number): number {
	const v = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
	return Math.max(0, Math.min(1, v));
}

function hexToOklab(hex: string): { L: number; a: number; b: number } {
	const r = srgbToLinear(parseInt(hex.slice(1, 3), 16) / 255);
	const g = srgbToLinear(parseInt(hex.slice(3, 5), 16) / 255);
	const b = srgbToLinear(parseInt(hex.slice(5, 7), 16) / 255);
	const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	return {
		L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
		a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
		b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
	};
}

function oklabToHex(L: number, a: number, b: number): string {
	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;
	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;
	const r = linearToSrgb(
		4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
	);
	const g = linearToSrgb(
		-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
	);
	const bl = linearToSrgb(
		-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
	);
	const toHex = (v: number) =>
		Math.round(v * 255)
			.toString(16)
			.padStart(2, "0");
	return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}
