import { describe, expect, it } from "vitest";
import {
	DEFAULT_KEYBINDINGS,
	matchesAction,
	matchesKeyCombo,
	parseKeyCombo,
} from "./keybindings";

describe("parseKeyCombo", () => {
	it("parses simple key", () => {
		const result = parseKeyCombo("p");
		expect(result).toEqual({
			ctrl: false,
			meta: false,
			shift: false,
			name: "p",
		});
	});

	it("parses ctrl+key", () => {
		const result = parseKeyCombo("ctrl+p");
		expect(result).toEqual({
			ctrl: true,
			meta: false,
			shift: false,
			name: "p",
		});
	});

	it("parses ctrl+shift+key", () => {
		const result = parseKeyCombo("ctrl+shift+p");
		expect(result).toEqual({ ctrl: true, meta: false, shift: true, name: "p" });
	});

	it("parses meta+key (alt)", () => {
		const result = parseKeyCombo("meta+backspace");
		expect(result).toEqual({
			ctrl: false,
			meta: true,
			shift: false,
			name: "backspace",
		});
	});

	it("parses alt+key as meta", () => {
		const result = parseKeyCombo("alt+x");
		expect(result).toEqual({
			ctrl: false,
			meta: true,
			shift: false,
			name: "x",
		});
	});

	it("handles uppercase in combo", () => {
		const result = parseKeyCombo("Ctrl+Shift+P");
		expect(result.ctrl).toBe(true);
		expect(result.shift).toBe(true);
		expect(result.name).toBe("p");
	});
});

describe("matchesKeyCombo", () => {
	it("matches exactly", () => {
		const combo = parseKeyCombo("ctrl+p");
		expect(
			matchesKeyCombo(
				{ name: "p", ctrl: true, meta: false, shift: false },
				combo,
			),
		).toBe(true);
	});

	it("does not match when ctrl differs", () => {
		const combo = parseKeyCombo("ctrl+p");
		expect(
			matchesKeyCombo(
				{ name: "p", ctrl: false, meta: false, shift: false },
				combo,
			),
		).toBe(false);
	});

	it("does not match when name differs", () => {
		const combo = parseKeyCombo("ctrl+p");
		expect(
			matchesKeyCombo(
				{ name: "q", ctrl: true, meta: false, shift: false },
				combo,
			),
		).toBe(false);
	});
});

describe("matchesAction", () => {
	it("matches default keybinding", () => {
		const keybindings = { ...DEFAULT_KEYBINDINGS };
		expect(
			matchesAction(
				{ name: "p", ctrl: true, meta: false, shift: false },
				keybindings,
				"commandPalette",
			),
		).toBe(true);
	});

	it("does not match wrong key", () => {
		const keybindings = { ...DEFAULT_KEYBINDINGS };
		expect(
			matchesAction(
				{ name: "q", ctrl: true, meta: false, shift: false },
				keybindings,
				"commandPalette",
			),
		).toBe(false);
	});

	it("returns false for unknown action", () => {
		const keybindings = { ...DEFAULT_KEYBINDINGS };
		expect(
			matchesAction(
				{ name: "x", ctrl: true, meta: false, shift: false },
				keybindings,
				"nonexistent",
			),
		).toBe(false);
	});
});

describe("DEFAULT_KEYBINDINGS", () => {
	it("has commandPalette", () => {
		expect(DEFAULT_KEYBINDINGS.commandPalette).toBeDefined();
		expect(DEFAULT_KEYBINDINGS.commandPalette.combo).toBe("ctrl+p");
	});

	it("has toggleMode", () => {
		expect(DEFAULT_KEYBINDINGS.toggleMode).toBeDefined();
	});

	it("has all essential actions", () => {
		expect(DEFAULT_KEYBINDINGS.abort).toBeDefined();
		expect(DEFAULT_KEYBINDINGS.exit).toBeDefined();
		expect(DEFAULT_KEYBINDINGS.openTree).toBeDefined();
		expect(DEFAULT_KEYBINDINGS.openExternalEditor).toBeDefined();
	});
});
