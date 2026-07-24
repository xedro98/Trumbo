/**
 * Retry an async operation with exponential backoff.
 *
 * The `shouldRetry` predicate decides whether a thrown error is retryable. If
 * it returns false, the abort signal is already aborted, or `maxRetries` is
 * exhausted, the error is rethrown immediately. Between attempts the abort
 * signal is checked so caller-initiated cancels abort in-flight retries
 * without waiting for the next backoff window.
 *
 * Used by the compaction summarizer and the main agent model-call loop so
 * transient transport failures (DNS, early EOF, 5xx) don't fail a whole run.
 */
export async function withRetry<T>(
	fn: () => Promise<T>,
	options: {
		maxRetries: number;
		signal?: AbortSignal;
		shouldRetry: (error: unknown) => boolean;
		onRetryAttempt?: (
			attempt: number,
			maxRetries: number,
			delayMs: number,
			error: unknown,
		) => void;
		baseDelayMs?: number;
	},
): Promise<T> {
	const baseDelayMs = options.baseDelayMs ?? 500;
	for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
		if (options.signal?.aborted) {
			throw options.signal.reason ?? new Error("Aborted");
		}
		try {
			return await fn();
		} catch (error) {
			if (options.signal?.aborted) {
				throw options.signal.reason ?? new Error("Aborted");
			}
			if (attempt >= options.maxRetries || !options.shouldRetry(error)) {
				throw error;
			}
			const delayMs = baseDelayMs * 2 ** attempt;
			options.onRetryAttempt?.(attempt + 1, options.maxRetries, delayMs, error);
			await new Promise((resolve) => setTimeout(resolve, delayMs));
		}
	}
	// Unreachable — the loop either returns on success or throws on the
	// terminal attempt. Kept for exhaustiveness.
	throw new Error("withRetry: unreachable");
}
