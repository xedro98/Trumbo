import { stripAnsiSequences } from "@opentui/core";

const ESC = "\u001b";
const BEL = "\u0007";

/** SGR mouse click/move fragments (with or without ESC / `[<` prefix). */
const MOUSE_SGR_FRAGMENT =
	/(?:\[<|<|[a-zA-Z])?\d+(?:;\d+){1,3}[Mm]|;\d+(?:;\d+){0,2}[Mm]|\d+(?:;\d+){2,}[Mm]/g;

/** CSI / mouse / OSC fragments that should never become prompt text. */
const LEAKED_CONTROL_SEQUENCE = new RegExp(
	`(?:${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)?|${ESC}\\[[\\d:;?<>$]*[A-Za-z~]|\\[[\\d:;?<>$]*[A-Za-z~]|\\[[<][\\d;]*[Mm]?)`,
	"g",
);

function containsMouseOrCsiLeak(text: string): boolean {
	if (!text) {
		return false;
	}
	if (text.includes(ESC)) {
		return true;
	}
	if (/^\[[\d:;?<>$]*[A-Za-z~]$/.test(text)) {
		return true;
	}
	if (/^\[[<][\d;]*[Mm]?$/.test(text)) {
		return true;
	}
	if (/^[<]\d+(?:;\d+){1,3}[Mm]$/.test(text)) {
		return true;
	}
	MOUSE_SGR_FRAGMENT.lastIndex = 0;
	return MOUSE_SGR_FRAGMENT.test(text);
}

export function isTerminalControlSequence(sequence: string): boolean {
	return containsMouseOrCsiLeak(sequence);
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
	if (containsMouseOrCsiLeak(sequence)) {
		return true;
	}
	// OpenTUI treats unknown multi-char sequences as printable text.
	if (sequence.length > 1 && (!input.name || input.name === sequence)) {
		return /^[[<][\d:;?<>$]/.test(sequence);
	}
	return false;
}

export function sanitizeTerminalInputText(text: string): string {
	return stripAnsiSequences(text)
		.replace(LEAKED_CONTROL_SEQUENCE, "")
		.replace(MOUSE_SGR_FRAGMENT, "");
}
