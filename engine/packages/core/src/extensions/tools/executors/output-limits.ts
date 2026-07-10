/**
 * Shared caps for how much tool output may enter the conversation. Every
 * character returned by an executor is re-sent to the model on each
 * subsequent request, so oversized outputs cost quadratically over the
 * remaining run. Limits are measured in characters (UTF-16 code units),
 * which tracks token cost more closely than bytes and is what JS strings
 * measure exactly. Executors enforce these caps; tool descriptions
 * reference them so the model pages or narrows instead of retrying.
 *
 * Truncation notices always live in the preserved head/tail of an entry,
 * never in the elided middle. Provider-request building may re-truncate
 * long strings with its own (possibly tighter) middle-cut backstop
 * (session/services/message-builder.ts); keeping the notices at the edges
 * means the recovery guidance survives that cut too.
 */

/** Max characters of command output kept; beyond this the middle is elided. */
export const MAX_COMMAND_OUTPUT_CHARS = 48_000;

export function truncateCommandOutput(
	text: string,
	options: { maxChars?: number; totalChars?: number } = {},
): string {
	const maxChars = options.maxChars ?? MAX_COMMAND_OUTPUT_CHARS;
	const totalChars = options.totalChars ?? text.length;
	if (text.length <= maxChars && totalChars <= maxChars) {
		return text;
	}

	const headLimit = Math.ceil(maxChars / 2);
	const tailLimit = Math.max(1, maxChars - headLimit);
	return (
		`${text.slice(0, headLimit)}\n` +
		`[... output truncated: ${totalChars} chars total. ` +
		`Use offset=${headLimit} to continue reading the elided middle ...]\n` +
		text.slice(-tailLimit)
	);
}

/** Max lines returned per file read when the range is larger or absent. */
export const MAX_READ_LINES = 2_000;

/** Max characters kept per line in file reads (defangs minified files). */
export const MAX_LINE_CHARS = 2_000;

/** Max characters returned per file read window. */
export const MAX_READ_OUTPUT_CHARS = 48_000;

/** Max characters returned per search query; beyond this the middle is elided. */
export const MAX_SEARCH_OUTPUT_CHARS = 48_000;

// --- OutputAccumulator + TruncationResult -----------------------------------
// A bounded-memory streaming collector for tool output. Keeps a head (first
// N chars) and a rolling tail (last N chars), tracking total chars seen. When
// the output exceeds the limit, the middle is elided with an actionable
// "Use offset=N to continue" notice so the model can page through the output.

export interface TruncationResult {
	/** The (possibly truncated) text with notice. */
	text: string;
	/** Total characters received (before truncation). */
	totalChars: number;
	/** Characters elided from the middle. */
	dropped: number;
	/** Character offset where the elided middle starts; the model can pass
	 * this as an offset to continue reading from this point. */
	nextOffset: number;
}

export class OutputAccumulator {
	private head = "";
	private tail = "";
	private totalChars = 0;
	private readonly headLimit: number;
	private readonly tailLimit: number;

	constructor(maxChars: number = MAX_COMMAND_OUTPUT_CHARS) {
		this.headLimit = Math.ceil(maxChars / 2);
		this.tailLimit = Math.max(1, maxChars - this.headLimit);
	}

	append(chunk: string): void {
		this.totalChars += chunk.length;
		if (this.head.length < this.headLimit) {
			const remaining = this.headLimit - this.head.length;
			this.head += chunk.slice(0, remaining);
			chunk = chunk.slice(remaining);
		}
		if (chunk.length > 0) {
			const newTail = this.tail + chunk;
			this.tail = newTail.slice(-this.tailLimit);
		}
	}

	snapshot(): TruncationResult {
		const dropped = Math.max(
			0,
			this.totalChars - this.head.length - this.tail.length,
		);
		if (dropped === 0) {
			return {
				text: this.head + this.tail,
				totalChars: this.totalChars,
				dropped: 0,
				nextOffset: this.totalChars,
			};
		}
		const nextOffset = this.head.length + dropped;
		return {
			text:
				`${this.head}\n` +
				`[... output truncated: ${this.totalChars} chars total. ` +
				`Use offset=${nextOffset} to continue reading the elided middle ...]\n` +
				this.tail,
			totalChars: this.totalChars,
			dropped,
			nextOffset,
		};
	}
}
