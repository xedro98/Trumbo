export type MarketingTheme = "light" | "dark" | "system";

export type ResolvedMarketingTheme = "light" | "dark";

export const MARKETING_THEME_STORAGE_KEY = "trumbo-marketing-theme";

export function readStoredMarketingTheme(): MarketingTheme {
	if (typeof window === "undefined") {
		return "system";
	}

	try {
		const stored = localStorage.getItem(MARKETING_THEME_STORAGE_KEY);
		if (stored === "light" || stored === "dark" || stored === "system") {
			return stored;
		}
	} catch {
		// ignore storage errors
	}

	return "system";
}

export function resolveMarketingTheme(theme: MarketingTheme): ResolvedMarketingTheme {
	if (theme === "light" || theme === "dark") {
		return theme;
	}

	if (typeof window === "undefined") {
		return "light";
	}

	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyMarketingTheme(theme: MarketingTheme) {
	const resolved = resolveMarketingTheme(theme);
	const root = document.documentElement;

	root.classList.remove("marketing-light", "marketing-dark");
	root.classList.add(resolved === "dark" ? "marketing-dark" : "marketing-light");
	root.style.colorScheme = resolved;

	const themeColor = document.querySelector('meta[name="theme-color"]');
	if (themeColor) {
		themeColor.setAttribute("content", resolved === "dark" ? "#111111" : "#2BBF77");
	}
}

export function persistMarketingTheme(theme: MarketingTheme) {
	try {
		localStorage.setItem(MARKETING_THEME_STORAGE_KEY, theme);
	} catch {
		// ignore storage errors
	}
}

export function nextMarketingTheme(theme: MarketingTheme): MarketingTheme {
	if (theme === "light") return "dark";
	if (theme === "dark") return "system";
	return "light";
}

export function marketingThemeLabel(theme: MarketingTheme): string {
	if (theme === "dark") return "Dark";
	if (theme === "system") return "System";
	return "Light";
}
