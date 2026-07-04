import { stripAnsiSequences } from "@opentui/core";

const ESC = "\u001b";
const BEL = "\u0007";

/** CSI / mouse / OSC fragments that should never become prompt text. */
const LEAKED_CONTROL_SEQUENCE = new RegExp(
	`(?:${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)?|${ESC}\\[[\\d:;?<>$]*[A-Za-z~]|\\[[\\d:;?<>$]*[A-Za-z~]|\\[[<][\\d;]*[Mm]?)`,
	"g",
);

export function isTerminalControlSequence(sequence: string): boolean {
	if (!sequence) {
		return false;
	}
	if (sequence.includes(ESC)) {
		return true;
	}
	if (/^\[[\d:;?<>$]*[A-Za-z~]$/.test(sequence)) {
		return true;
	}
	if (/^\[[<][\d;]*[Mm]?$/.test(sequence)) {
		return true;
	}
	return false;
}

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
	if (isTerminalControlSequence(sequence)) {
		return true;
	}
	// OpenTUI treats unknown multi-char sequences as printable text.
	if (sequence.length > 1 && (!input.name || input.name === sequence)) {
		return /^\[[\d:;?<>$]/.test(sequence);
	}
	return false;
}

export function sanitizeTerminalInputText(text: string): string {
	return stripAnsiSequences(text).replace(LEAKED_CONTROL_SEQUENCE, "");
}
