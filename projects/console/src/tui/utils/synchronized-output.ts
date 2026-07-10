/**
 * CSI 2026 synchronized output support.
 *
 * CSI 2026 (DECSM 2026) is a terminal protocol that allows applications to
 * batch output updates into a single atomic frame, eliminating flicker and
 * visual tearing. When supported by the terminal, the renderer wraps burst
 * updates in `\x1b[?2026h` (begin) and `\x1b[?2026l` (end) sequences.
 *
 * Detection: We check the `TRUMBO_SYNC_OUTPUT` env var first, then fall back
 * to a list of known-supporting terminals. Runtime detection via DA1/DA2
 * responses is possible but requires async terminal queries that are not
 * practical in the current synchronous render path.
 *
 * @see https://gist.github.com/egmontkov/eb114294efbcd5adb1944c9842f0ec18
 */

/** Known terminals that support CSI 2026 synchronized output */
const KNOWN_SYNC_TERMINALS = [
	"kitty",
	"wezterm",
	"foot",
	"ghostty",
	"alacritty",
	"konsole",
	"tmux",
];

const SYNC_BEGIN = "\x1b[?2026h";
const SYNC_END = "\x1b[?2026l";

let cachedSupport: boolean | undefined;

/**
 * Check whether the current terminal supports CSI 2026 synchronized output.
 *
 * Detection order:
 * 1. `TRUMBO_SYNC_OUTPUT=1` forces enabled
 * 2. `TRUMBO_SYNC_OUTPUT=0` forces disabled
 * 3. `TERM_PROGRAM` or `TERM` matches a known-supporting terminal
 */
export function supportsSynchronizedOutput(): boolean {
	if (cachedSupport !== undefined) return cachedSupport;

	const envVar = process.env.TRUMBO_SYNC_OUTPUT;
	if (envVar === "1" || envVar === "true") {
		cachedSupport = true;
		return true;
	}
	if (envVar === "0" || envVar === "false") {
		cachedSupport = false;
		return false;
	}

	const termProgram = (process.env.TERM_PROGRAM ?? "").toLowerCase();
	const term = (process.env.TERM ?? "").toLowerCase();

	cachedSupport = KNOWN_SYNC_TERMINALS.some(
		(t) => termProgram.includes(t) || term.includes(t),
	);

	return cachedSupport;
}

/**
 * Wrap a string of terminal output in synchronized output sequences.
 *
 * If the terminal doesn't support CSI 2026, returns the input unchanged.
 *
 * @param content The terminal output to wrap
 * @returns The wrapped output, or the input unchanged if unsupported
 */
export function wrapSynchronized(content: string): string {
	if (!supportsSynchronizedOutput()) return content;
	return `${SYNC_BEGIN}${content}${SYNC_END}`;
}

/**
 * Begin a synchronized output block.
 *
 * Write this to stdout before a burst of updates.
 */
export function beginSynchronizedOutput(): string {
	return supportsSynchronizedOutput() ? SYNC_BEGIN : "";
}

/**
 * End a synchronized output block.
 *
 * Write this to stdout after a burst of updates.
 */
export function endSynchronizedOutput(): string {
	return supportsSynchronizedOutput() ? SYNC_END : "";
}

/**
 * Reset the cached support check. Only for testing.
 */
export function _resetSyncSupportCacheForTest(): void {
	cachedSupport = undefined;
}
