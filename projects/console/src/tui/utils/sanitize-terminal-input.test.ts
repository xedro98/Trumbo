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

	it("strips leaked fragments from prompt text", () => {
		expect(sanitizeTerminalInputText("fix bug[555;56;25m now")).toBe(
			"fix bug now",
		);
		expect(sanitizeTerminalInputText("\x1b[38;2;55;56;25mtyped")).toBe("typed");
	});
});
