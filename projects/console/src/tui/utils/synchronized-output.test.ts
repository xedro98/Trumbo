import { beforeEach, describe, expect, it } from "vitest";
import {
	_resetSyncSupportCacheForTest,
	beginSynchronizedOutput,
	endSynchronizedOutput,
	supportsSynchronizedOutput,
	wrapSynchronized,
} from "./synchronized-output";

beforeEach(() => {
	_resetSyncSupportCacheForTest();
	delete process.env.TRUMBO_SYNC_OUTPUT;
	delete process.env.TERM_PROGRAM;
	delete process.env.TERM;
});

describe("supportsSynchronizedOutput", () => {
	it("returns true when TRUMBO_SYNC_OUTPUT=1", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "1";
		expect(supportsSynchronizedOutput()).toBe(true);
	});

	it("returns true when TRUMBO_SYNC_OUTPUT=true", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "true";
		expect(supportsSynchronizedOutput()).toBe(true);
	});

	it("returns false when TRUMBO_SYNC_OUTPUT=0", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "0";
		expect(supportsSynchronizedOutput()).toBe(false);
	});

	it("returns false when TRUMBO_SYNC_OUTPUT=false", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "false";
		expect(supportsSynchronizedOutput()).toBe(false);
	});

	it("returns true for kitty terminal", () => {
		process.env.TERM_PROGRAM = "kitty";
		expect(supportsSynchronizedOutput()).toBe(true);
	});

	it("returns true for wezterm terminal", () => {
		process.env.TERM_PROGRAM = "WezTerm";
		expect(supportsSynchronizedOutput()).toBe(true);
	});

	it("returns false for unknown terminal", () => {
		process.env.TERM = "xterm-256color";
		expect(supportsSynchronizedOutput()).toBe(false);
	});

	it("caches the result", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "1";
		expect(supportsSynchronizedOutput()).toBe(true);
		process.env.TRUMBO_SYNC_OUTPUT = "0";
		expect(supportsSynchronizedOutput()).toBe(true); // cached
	});
});

describe("wrapSynchronized", () => {
	it("wraps content when supported", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "1";
		const result = wrapSynchronized("hello");
		expect(result).toContain("\x1b[?2026h");
		expect(result).toContain("hello");
		expect(result).toContain("\x1b[?2026l");
	});

	it("returns content unchanged when not supported", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "0";
		const result = wrapSynchronized("hello");
		expect(result).toBe("hello");
	});
});

describe("beginSynchronizedOutput / endSynchronizedOutput", () => {
	it("returns escape sequences when supported", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "1";
		expect(beginSynchronizedOutput()).toBe("\x1b[?2026h");
		expect(endSynchronizedOutput()).toBe("\x1b[?2026l");
	});

	it("returns empty string when not supported", () => {
		process.env.TRUMBO_SYNC_OUTPUT = "0";
		expect(beginSynchronizedOutput()).toBe("");
		expect(endSynchronizedOutput()).toBe("");
	});
});
