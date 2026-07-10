import { afterEach, describe, expect, it } from "vitest";
import {
	getBrandColor,
	getMagicColor,
	getModeAccent,
	getSuccessColor,
	getTerminalTheme,
	getToolAccent,
	getUserColor,
	resolveThemePalette,
} from "./palette";
import { clearThemeCache } from "./utils/themes";

afterEach(() => {
	delete process.env.TRUMBO_THEME;
	clearThemeCache();
});

describe("getTerminalTheme", () => {
	it("detects light terminals from the default background", () => {
		expect(getTerminalTheme("#ffffff")).toBe("light");
		expect(getTerminalTheme("#fdf6e3")).toBe("light");
	});

	it("detects dark terminals from the default background", () => {
		expect(getTerminalTheme("#000000")).toBe("dark");
		expect(getTerminalTheme("#002b36")).toBe("dark");
	});

	it("uses the foreground as a fallback when background is unavailable", () => {
		expect(getTerminalTheme(null, "#1a1a1a")).toBe("light");
		expect(getTerminalTheme(null, "#f0f0f0")).toBe("dark");
	});

	it("defaults to the existing dark theme when detection is unavailable", () => {
		expect(getTerminalTheme(null, null)).toBe("dark");
	});
});

describe("theme-aware palette helpers", () => {
	it("uses the built-in dark theme hex accents for dark terminals", () => {
		expect(getModeAccent("act", "dark")).toBe("#2BBF77");
		expect(getModeAccent("plan", "dark")).toBe("#f0c040");
		expect(getSuccessColor("dark")).toBe("#22c55e");
		expect(getBrandColor("dark")).toBe("#2BBF77");
	});

	it("uses darker accents on light terminals", () => {
		expect(getModeAccent("act", "light")).toBe("#15803d");
		expect(getModeAccent("plan", "light")).toBe("#9a6700");
		expect(getSuccessColor("light")).toBe("#116329");
	});

	it("preserves role colors per terminal theme", () => {
		expect(getUserColor("dark")).toBe("#5fb3f5");
		expect(getMagicColor("dark")).toBe("#b794f4");
		expect(getToolAccent("dark")).toBe("#e0af68");
		expect(getUserColor("light")).toBe("#2563eb");
	});
});

describe("resolveThemePalette", () => {
	it("falls back to the detected built-in theme without TRUMBO_THEME", () => {
		expect(resolveThemePalette("dark").act).toBe("#2BBF77");
		expect(resolveThemePalette("light").act).toBe("#15803d");
	});

	it("honors a TRUMBO_THEME override with a named built-in theme", () => {
		process.env.TRUMBO_THEME = "dracula";
		expect(resolveThemePalette("dark").act).toBe("#bd93f9");
		expect(resolveThemePalette("dark").brand).toBe("#bd93f9");
		// role colors still come from the detected terminal theme
		expect(resolveThemePalette("dark").user).toBe("#5fb3f5");
	});

	it("ignores an unknown TRUMBO_THEME and falls back to the detected theme", () => {
		process.env.TRUMBO_THEME = "no-such-theme";
		expect(resolveThemePalette("dark").act).toBe("#2BBF77");
	});

	it("caches the resolved palette per (override, theme)", () => {
		const a = resolveThemePalette("dark");
		const b = resolveThemePalette("dark");
		expect(a).toBe(b);
	});
});
