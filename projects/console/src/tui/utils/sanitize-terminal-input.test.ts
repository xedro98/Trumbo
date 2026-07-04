import { describe, expect, it } from "vitest";
import {
	isTerminalControlSequence,
	sanitizeTerminalInputText,
	shouldBlockTerminalInputKey,
} from "./sanitize-terminal-input";

describe("sanitize-terminal-input", () => {
	it("detects mouse and SGR CSI leaks", () => {
		expect(isTerminalControlSequence("\x1b[<35;56;25m")).toBe(true);
		expect(isTerminalControlSequence("\x1b[38;2;55;56;25m")).toBe(true);
		expect(isTerminalControlSequence("[555;56;25m")).toBe(true);
	});

	it("blocks leaked CSI key sequences", () => {
		expect(
			shouldBlockTerminalInputKey({
				sequence: "\x1b[38;2;55;56;25m",
				name: "\x1b[38;2;55;56;25m",
			}),
		).toBe(true);
		expect(
			shouldBlockTerminalInputKey({
				sequence: "[555;56;25m",
				name: "[555;56;25m",
			}),
		).toBe(true);
		expect(
			shouldBlockTerminalInputKey({
				sequence: "hello",
				name: "h",
			}),
		).toBe(false);
	});

	it("strips mangled Windows click leaks from prompt text", () => {
		const leaked = "i0;68;19m;19M32;26;18M;28;18M32;33;36;19M<32;50;200M";
		expect(sanitizeTerminalInputText(`fix ${leaked} bug`)).toBe("fix  bug");
		expect(
			shouldBlockTerminalInputKey({
				sequence: "<32;50;20M",
				name: "<32;50;20M",
			}),
		).toBe(true);
	});
});
