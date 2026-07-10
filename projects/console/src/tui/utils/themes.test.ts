import { describe, expect, it } from "vitest";
import {
	BUILTIN_DARK,
	BUILTIN_DRACULA,
	BUILTIN_NORD,
	BUILTIN_SOLARIZED,
	BUILTIN_THEMES,
	getTheme,
	loadThemes,
	type ThemeTokens,
	themeToPalette,
} from "./themes";

describe("BUILTIN_THEMES", () => {
	it("has dark, light, dracula, nord, solarized", () => {
		expect(BUILTIN_THEMES.dark).toBeDefined();
		expect(BUILTIN_THEMES.light).toBeDefined();
		expect(BUILTIN_THEMES.dracula).toBeDefined();
		expect(BUILTIN_THEMES.nord).toBeDefined();
		expect(BUILTIN_THEMES.solarized).toBeDefined();
	});

	it("all themes have 51 tokens", () => {
		const requiredTokens: (keyof ThemeTokens)[] = [
			"background",
			"foreground",
			"surface",
			"surfaceBright",
			"surfaceDim",
			"border",
			"borderStrong",
			"selection",
			"textOnSelection",
			"textOnPrimary",
			"textOnSecondary",
			"textMuted",
			"brand",
			"brandBright",
			"act",
			"plan",
			"success",
			"error",
			"warning",
			"info",
			"syntaxKeyword",
			"syntaxString",
			"syntaxNumber",
			"syntaxComment",
			"syntaxFunction",
			"syntaxVariable",
			"syntaxType",
			"syntaxConstant",
			"syntaxOperator",
			"syntaxPunctuation",
			"syntaxTag",
			"syntaxAttribute",
			"diffAddedBg",
			"diffRemovedBg",
			"diffAddedFg",
			"diffRemovedFg",
			"diffAddedSign",
			"diffRemovedSign",
			"thinkingNone",
			"thinkingLow",
			"thinkingMedium",
			"thinkingHigh",
			"accent1",
			"accent2",
			"accent3",
			"accent4",
			"accent5",
			"link",
			"linkHover",
			"cursor",
			"dim",
		];
		expect(requiredTokens).toHaveLength(51);

		for (const [, theme] of Object.entries(BUILTIN_THEMES)) {
			for (const token of requiredTokens) {
				expect(
					theme.tokens[token],
					`Theme ${theme.name} missing token ${token}`,
				).toBeDefined();
			}
		}
	});

	it("dark theme has brand green", () => {
		expect(BUILTIN_DARK.brand).toBe("#2BBF77");
	});

	it("dracula has purple selection", () => {
		expect(BUILTIN_DRACULA.selection).toBe("#bd93f9");
	});

	it("nord has frost blue selection", () => {
		expect(BUILTIN_NORD.selection).toBe("#88c0d0");
	});

	it("solarized has cyan selection", () => {
		expect(BUILTIN_SOLARIZED.selection).toBe("#2aa198");
	});
});

describe("loadThemes", () => {
	it("returns at least the built-in themes", () => {
		const themes = loadThemes();
		expect(themes.dark).toBeDefined();
		expect(themes.light).toBeDefined();
	});
});

describe("getTheme", () => {
	it("returns the requested theme", () => {
		const themes = BUILTIN_THEMES;
		expect(getTheme(themes, "dracula")).toBe(themes.dracula);
	});

	it("falls back to dark for unknown theme", () => {
		const themes = BUILTIN_THEMES;
		expect(getTheme(themes, "nonexistent")).toBe(themes.dark);
	});
});

describe("themeToPalette", () => {
	it("maps theme tokens to legacy palette format", () => {
		const palette = themeToPalette(BUILTIN_DARK);
		expect(palette.brand).toBe(BUILTIN_DARK.brand);
		expect(palette.selection).toBe(BUILTIN_DARK.selection);
		expect(palette.border).toBe(BUILTIN_DARK.border);
	});
});
