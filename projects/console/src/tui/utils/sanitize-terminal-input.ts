import { stripAnsiSequences } from "@opentui/core";

const ESC = "\u001b";
const BEL = "\u0007";

/**
 * SGR mouse click/move fragments that leak through stdin on Windows ConPTY.
 * Matches patterns like: <32;50;20M, 0;68;19m, 32;26;18M, [555;56;25m
 * with or without a leading ESC / `[<` / stray alpha prefix.
 */
const MOUSE_SGR_FRAGMENT =
	/(?:\[<|<|[a-zA-Z])?\d+(?:;\d+){1,3}[Mm]|;\d+(?:;\d+){0,2}[Mm]|\d+(?:;\d+){2,}[Mm]/g;

/** CSI / mouse / OSC fragments that should never become prompt text. */
const LEAKED_CONTROL_SEQUENCE = new RegExp(
	`(?:${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)?|${ESC}\\[[\\d:;?<>$]*[A-Za-z~]|\\[[\\d:;?<>$]*[A-Za-z~]|\\[[<][\\d;]*[Mm]?)`,
	"g",
);

/**
 * Detects a leaked mouse/SGR fragment. Intentionally narrow: does NOT flag
 * legitimate keyboard escape sequences (arrows, function keys, etc.) just
 * because they contain ESC — only flags patterns that look like mouse reports.
 */
export function isMouseLeakSequence(sequence: string): boolean {
	if (!sequence) {
		return false;
	}
	// SGR mouse without ESC prefix: <32;50;20M
	if (/^[<]\d+(?:;\d+){1,3}[Mm]$/.test(sequence)) {
		return true;
	}
	// SGR mouse fragment without delimiters: 32;26;18M
	if (/^\d+(?:;\d+){1,3}[Mm]$/.test(sequence)) {
		return true;
	}
	// CSI-like fragment starting with `[` but without ESC, ending in M/m with digits+semicolons
	if (/^\[\d+(?:;\d+){1,3}[Mm]$/.test(sequence)) {
		return true;
	}
	// Stray fragment with leading alpha + digits + semicolons + M/m (mangled ConPTY leak)
	if (/^[a-zA-Z]\d+(?:;\d+){1,3}[Mm]$/.test(sequence)) {
		return true;
	}
	return false;
}

/** @deprecated Use isMouseLeakSequence — kept for backward compat. */
export function isTerminalControlSequence(sequence: string): boolean {
	return isMouseLeakSequence(sequence);
}

/**
 * Decides whether a key event should be blocked before reaching the textarea.
 * ONLY blocks mouse/SGR leaks — never legitimate keyboard escape sequences.
 */
export function shouldBlockTerminalInputKey(input: {
	sequence?: string;
	name?: string;
	ctrl?: boolean;
	meta?: boolean;
	super?: boolean;
	hyper?: boolean;
}): boolean {
	if (input.ctrl || input.meta || input.super || input.hyper) {
		return false;
	}
	const sequence = input.sequence ?? "";
	if (!sequence) {
		return false;
	}
	// If parseKeypress gave us a real key name, this is a legitimate key
	// (arrow, function key, etc.) — always allow it.
	const name = input.name ?? "";
	if (name && name !== sequence && name !== "escape") {
		return false;
	}
	// Single character — always allow (printable character).
	if (sequence.length <= 1) {
		return false;
	}
	// Unrecognized multi-char sequence — block only if it looks like a mouse leak.
	return isMouseLeakSequence(sequence);
}

export function sanitizeTerminalInputText(text: string): string {
	return stripAnsiSequences(text)
		.replace(LEAKED_CONTROL_SEQUENCE, "")
		.replace(MOUSE_SGR_FRAGMENT, "");
}
