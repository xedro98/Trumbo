import { describe, expect, it } from "vitest";
import { KillRing } from "./kill-ring";

describe("KillRing", () => {
	it("starts empty", () => {
		const ring = new KillRing();
		expect(ring.size).toBe(0);
		expect(ring.yank()).toBeUndefined();
	});

	it("pushes killed text and yanks it back", () => {
		const ring = new KillRing();
		ring.kill("hello", false);
		expect(ring.size).toBe(1);
		expect(ring.yank()).toBe("hello");
	});

	it("accumulates consecutive kills", () => {
		const ring = new KillRing();
		ring.kill("hello", false);
		ring.kill(" world", true);
		expect(ring.size).toBe(1);
		expect(ring.yank()).toBe("hello world");
	});

	it("does not accumulate after a non-kill (markEdit)", () => {
		const ring = new KillRing();
		ring.kill("hello", false);
		ring.markEdit();
		ring.kill("world", true);
		expect(ring.size).toBe(2);
	});

	it("yankPop rotates to the next entry", () => {
		const ring = new KillRing();
		ring.kill("first", false);
		ring.kill("second", false);
		expect(ring.yank()).toBe("second");
		expect(ring.yankPop()).toBe("first");
		expect(ring.yankPop()).toBe("second");
	});

	it("clears the ring", () => {
		const ring = new KillRing();
		ring.kill("a", false);
		ring.kill("b", false);
		ring.clear();
		expect(ring.size).toBe(0);
		expect(ring.yank()).toBeUndefined();
	});
});
