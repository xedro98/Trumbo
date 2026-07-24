import { describe, expect, it, vi } from "vitest";
import { withRetry } from "./retry";

describe("withRetry", () => {
	it("returns the result on the first successful attempt", async () => {
		const fn = vi.fn(async () => "ok");
		const result = await withRetry(fn, {
			maxRetries: 3,
			shouldRetry: () => false,
		});
		expect(result).toBe("ok");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("retries on retryable errors and succeeds on a later attempt", async () => {
		let calls = 0;
		const fn = vi.fn(async () => {
			calls++;
			if (calls < 3) throw new Error("transient");
			return "recovered";
		});
		const result = await withRetry(fn, {
			maxRetries: 3,
			shouldRetry: (e) => (e as Error).message === "transient",
			baseDelayMs: 1,
		});
		expect(result).toBe("recovered");
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("rethrows non-retryable errors immediately", async () => {
		const fn = vi.fn(async () => {
			throw new Error("fatal");
		});
		await expect(
			withRetry(fn, {
				maxRetries: 3,
				shouldRetry: (e) => (e as Error).message !== "fatal",
				baseDelayMs: 1,
			}),
		).rejects.toThrow("fatal");
		expect(fn).toHaveBeenCalledTimes(1);
	});

	it("gives up after maxRetries and rethrows the last error", async () => {
		const fn = vi.fn(async () => {
			throw new Error("always fails");
		});
		await expect(
			withRetry(fn, {
				maxRetries: 2,
				shouldRetry: () => true,
				baseDelayMs: 1,
			}),
		).rejects.toThrow("always fails");
		expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
	});

	it("aborts immediately when the signal is already aborted", async () => {
		const fn = vi.fn(async () => "ok");
		const controller = new AbortController();
		controller.abort(new Error("user cancel"));
		await expect(
			withRetry(fn, {
				maxRetries: 3,
				signal: controller.signal,
				shouldRetry: () => true,
			}),
		).rejects.toThrow("user cancel");
		expect(fn).not.toHaveBeenCalled();
	});

	it("invokes onRetryAttempt with attempt, maxRetries, delay, and error", async () => {
		let calls = 0;
		const fn = vi.fn(async () => {
			calls++;
			if (calls < 2) throw new Error("retry me");
			return "ok";
		});
		const onRetryAttempt = vi.fn();
		await withRetry(fn, {
			maxRetries: 3,
			shouldRetry: () => true,
			onRetryAttempt,
			baseDelayMs: 1,
		});
		expect(onRetryAttempt).toHaveBeenCalledTimes(1);
		expect(onRetryAttempt).toHaveBeenCalledWith(1, 3, 1, expect.any(Error));
	});
});
