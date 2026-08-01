import { describe, expect, it } from "vitest";
import { resolveMcpTimeoutMs } from "./client";
import type { McpServerRegistration } from "./types";

function registration(
	overrides: Partial<McpServerRegistration> = {},
): McpServerRegistration {
	return {
		name: "demo",
		transport: {
			type: "stdio",
			command: "npx",
		},
		...overrides,
	};
}

describe("resolveMcpTimeoutMs", () => {
	it("returns undefined when no per-server timeout is set", () => {
		expect(resolveMcpTimeoutMs(registration())).toBeUndefined();
		expect(
			resolveMcpTimeoutMs(registration({ timeout: undefined })),
		).toBeUndefined();
	});

	it("converts seconds to milliseconds", () => {
		expect(resolveMcpTimeoutMs(registration({ timeout: 30 }))).toBe(30_000);
		expect(resolveMcpTimeoutMs(registration({ timeout: 0.5 }))).toBe(500);
	});

	it("treats non-positive timeouts as unset (fall back to defaults)", () => {
		expect(resolveMcpTimeoutMs(registration({ timeout: 0 }))).toBeUndefined();
		expect(resolveMcpTimeoutMs(registration({ timeout: -1 }))).toBeUndefined();
	});
});
