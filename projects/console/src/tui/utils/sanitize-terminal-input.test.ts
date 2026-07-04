import { describe, expect, it } from "vitest";
import {
	isMouseLeakSequence,
	sanitizeTerminalInputText,
	shouldBlockTerminalInputKey,
} from "./sanitize-terminal-input";

describe("sanitize-terminal-input", () => {
	it("detects mouse and SGR CSI leaks", () => {
		expect(isMouseLeakSequence("\x1b[<35;56;25m")).toBe(false); // full CSI is handled by OpenTUI
		expect(isMouseLeakSequence("<35;56;25m")).toBe(true);
		expect(isMouseLeakSequence("32;26;18M")).toBe(true);
		expect(isMouseLeakSequence("[555;56;25m")).toBe(true);
		expect(isMouseLeakSequence("i0;68;19m")).toBe(true); // mangled ConPTY leak ending in m
	});

	it("blocks leaked SGR mouse key sequences", () => {
		expect(
			shouldBlockTerminalInputKey({
				sequence: "<32;50;20M",
				name: "<32;50;20M",
			}),
		).toBe(true);
		expect(
			shouldBlockTerminalInputKey({
				sequence: "32;26;18M",
				name: "32;26;18M",
			}),
		).toBe(true);
		expect(
			shouldBlockTerminalInputKey({
				sequence: "[555;56;25m",
				name: "[555;56;25m",
			}),
		).toBe(true);
	});

	it("allows legitimate keyboard escape sequences", () => {
		// Arrow keys — have proper names from parseKeypress
		expect(
			shouldBlockTerminalInputKey({
				sequence: "\x1b[A",
				name: "up",
			}),
		).toBe(false);
		expect(
			shouldBlockTerminalInputKey({
				sequence: "\x1b[B",
				name: "down",
			}),
		).toBe(false);
		// Delete key
		expect(
			shouldBlockTerminalInputKey({
				sequence: "\x1b[3~",
				name: "delete",
			}),
		).toBe(false);
		// Regular printable characters
		expect(
			shouldBlockTerminalInputKey({
				sequence: "a",
				name: "a",
			}),
		).toBe(false);
		expect(
			shouldBlockTerminalInputKey({
				sequence: "hello",
				name: "h",
			}),
		).toBe(false);
		// Return / backspace
		expect(
			shouldBlockTerminalInputKey({
				sequence: "\r",
				name: "return",
			}),
		).toBe(false);
		expect(
			shouldBlockTerminalInputKey({
				sequence: "\x7F",
				name: "backspace",
			}),
		).toBe(false);
		// Escape key itself
		expect(
			shouldBlockTerminalInputKey({
				sequence: "\x1b",
				name: "escape",
			}),
		).toBe(false);
		// Tab
		expect(
			shouldBlockTerminalInputKey({
				sequence: "\t",
				name: "tab",
			}),
		).toBe(false);
	});

	it("strips mangled Windows click leaks from prompt text", () => {
		const leaked = "i0;68;19m;19M32;26;18M;28;18M32;33;36;19M<32;50;200M";
		expect(sanitizeTerminalInputText(`fix ${leaked} bug`)).toBe("fix  bug");
	});
});
