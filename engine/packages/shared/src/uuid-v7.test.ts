import { describe, expect, it } from "vitest";
import { isUuidV7, uuidV7 } from "./uuid-v7";

describe("uuidV7", () => {
	it("generates a valid UUIDv7 string", () => {
		const id = uuidV7();
		expect(isUuidV7(id)).toBe(true);
		// Canonical lowercase 8-4-4-4-12 format.
		expect(id).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
		);
	});

	it("generates unique ids across a large batch", () => {
		const ids = new Set(Array.from({ length: 5000 }, () => uuidV7()));
		expect(ids.size).toBe(5000);
	});

	it("encodes a non-decreasing timestamp prefix", () => {
		// The first 12 hex chars (48-bit ms timestamp) must be non-decreasing
		// across sequential calls, since Date.now() never goes backwards.
		let prevPrefix = "";
		for (let i = 0; i < 100; i++) {
			const id = uuidV7();
			const prefix = id.slice(0, 13).replace("-", "");
			expect(prefix >= prevPrefix).toBe(true);
			prevPrefix = prefix;
		}
	});

	it("rejects non-v7 uuids and garbage", () => {
		// UUIDv4 has version nibble 4, not 7.
		expect(isUuidV7("550e8400-e29b-41d4-a716-446655440000")).toBe(false);
		expect(isUuidV7("not-a-uuid")).toBe(false);
		expect(isUuidV7("")).toBe(false);
	});
});
