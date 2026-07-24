import { describe, expect, it, vi } from "vitest";
import { isDnsTransportError, wrapFetchForDnsRetry } from "./http";

describe("isDnsTransportError", () => {
	it("matches a top-level ENOTFOUND code", () => {
		const error = Object.assign(new Error("fetch failed"), {
			code: "ENOTFOUND",
		});
		expect(isDnsTransportError(error)).toBe(true);
	});

	it("matches a top-level EAI_AGAIN code", () => {
		const error = Object.assign(new Error("fetch failed"), {
			code: "EAI_AGAIN",
		});
		expect(isDnsTransportError(error)).toBe(true);
	});

	it("matches a wrapped cause code (TypeError -> cause)", () => {
		const cause = Object.assign(new Error("getaddrinfo failed"), {
			code: "ENOTFOUND",
		});
		const error = new TypeError("fetch failed", { cause });
		expect(isDnsTransportError(error)).toBe(true);
	});

	it("matches a getaddrinfo ENOTFOUND message", () => {
		const error = new Error("getaddrinfo ENOTFOUND api.example.com");
		expect(isDnsTransportError(error)).toBe(true);
	});

	it("does not match unrelated errors", () => {
		expect(isDnsTransportError(new Error("internal server error"))).toBe(false);
		expect(
			isDnsTransportError(
				Object.assign(new Error("socket hang up"), { code: "ECONNRESET" }),
			),
		).toBe(false);
		expect(isDnsTransportError(undefined)).toBe(false);
		expect(isDnsTransportError(null)).toBe(false);
	});
});

describe("wrapFetchForDnsRetry", () => {
	it("retries on DNS errors and succeeds on a later attempt", async () => {
		let calls = 0;
		const baseFetch: typeof fetch = vi.fn(async () => {
			calls++;
			if (calls < 3) {
				throw Object.assign(new Error("fetch failed"), { code: "ENOTFOUND" });
			}
			return new Response("ok", { status: 200 });
		});

		const wrapped = wrapFetchForDnsRetry(baseFetch, 2);
		const response = await wrapped?.("https://example.com");

		expect(response.status).toBe(200);
		expect(calls).toBe(3);
	});

	it("rethrows non-DNS errors immediately without retrying", async () => {
		let calls = 0;
		const baseFetch: typeof fetch = vi.fn(async () => {
			calls++;
			throw Object.assign(new Error("socket hang up"), {
				code: "ECONNRESET",
			});
		});

		const wrapped = wrapFetchForDnsRetry(baseFetch, 2);
		await expect(wrapped?.("https://example.com")).rejects.toThrow(
			"socket hang up",
		);
		expect(calls).toBe(1);
	});

	it("gives up after maxRetries and rethrows the last DNS error", async () => {
		let calls = 0;
		const baseFetch: typeof fetch = vi.fn(async () => {
			calls++;
			throw Object.assign(new Error("fetch failed"), { code: "ENOTFOUND" });
		});

		const wrapped = wrapFetchForDnsRetry(baseFetch, 2);
		await expect(wrapped?.("https://example.com")).rejects.toThrow(
			"fetch failed",
		);
		expect(calls).toBe(3); // initial + 2 retries
	});

	it("falls back to globalThis.fetch when baseFetch is undefined", () => {
		// In runtimes where globalThis.fetch exists (Node, bun, browsers),
		// passing undefined wraps the global fetch rather than returning undefined.
		const wrapped = wrapFetchForDnsRetry(undefined);
		expect(typeof wrapped).toBe("function");
	});
});
