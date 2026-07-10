/**
 * User keybindings loader.
 *
 * Loads `~/.trumbo/keybindings.json` and merges with built-in defaults.
 * The JSON file maps action names to key combo strings, e.g.:
 *
 * ```json
 * {
 *   "commandPalette": "ctrl+p",
 *   "toggleMode": "ctrl+m",
 *   "abort": "ctrl+c",
 *   "exit": "ctrl+q"
 * }
 * ```
 *
 * Key combo format: `[ctrl+][meta+][shift+]<keyName>`
 * Examples: `ctrl+p`, `shift+tab`, `meta+backspace`, `ctrl+shift+p`
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveTrumboDir } from "@trumbo/shared/storage";

export interface KeybindingEntry {
	/** Key combo string, e.g. "ctrl+p" */
	combo: string;
}

export type KeybindingMap = Record<string, KeybindingEntry>;

export interface ParsedKeyCombo {
	ctrl: boolean;
	meta: boolean;
	shift: boolean;
	name: string;
}

/** Default keybindings — can be overridden by ~/.trumbo/keybindings.json */
export const DEFAULT_KEYBINDINGS: KeybindingMap = {
	commandPalette: { combo: "ctrl+p" },
	toggleMode: { combo: "ctrl+m" },
	abort: { combo: "ctrl+c" },
	exit: { combo: "ctrl+q" },
	openTree: { combo: "ctrl+t" },
	openExternalEditor: { combo: "ctrl+g" },
	scrollUp: { combo: "ctrl+u" },
	scrollDown: { combo: "ctrl+d" },
	scrollToTop: { combo: "ctrl+home" },
	scrollToBottom: { combo: "ctrl+end" },
};

/**
 * Parse a key combo string into its components.
 *
 * @example
 * parseKeyCombo("ctrl+shift+p") → { ctrl: true, meta: false, shift: true, name: "p" }
 * parseKeyCombo("meta+backspace") → { ctrl: false, meta: true, shift: false, name: "backspace" }
 */
export function parseKeyCombo(combo: string): ParsedKeyCombo {
	const parts = combo.toLowerCase().trim().split("+");
	const name = parts.pop() ?? "";
	return {
		ctrl: parts.includes("ctrl"),
		meta: parts.includes("meta") || parts.includes("alt"),
		shift: parts.includes("shift"),
		name,
	};
}

/**
 * Check if a KeyEvent matches a parsed key combo.
 */
export function matchesKeyCombo(
	key: { name: string; ctrl: boolean; meta: boolean; shift: boolean },
	combo: ParsedKeyCombo,
): boolean {
	return (
		key.name === combo.name &&
		!!key.ctrl === combo.ctrl &&
		!!key.meta === combo.meta &&
		!!key.shift === combo.shift
	);
}

/**
 * Load user keybindings from `~/.trumbo/keybindings.json` and merge with defaults.
 *
 * User overrides take precedence. Invalid entries are silently ignored.
 */
export function loadKeybindings(): KeybindingMap {
	const merged: KeybindingMap = { ...DEFAULT_KEYBINDINGS };

	const keybindingsPath = join(resolveTrumboDir(), "keybindings.json");
	if (!existsSync(keybindingsPath)) {
		return merged;
	}

	try {
		const raw = readFileSync(keybindingsPath, "utf8");
		const parsed = JSON.parse(raw) as Record<string, unknown>;

		for (const [action, value] of Object.entries(parsed)) {
			if (typeof value === "string") {
				merged[action] = { combo: value };
			} else if (
				value &&
				typeof value === "object" &&
				typeof (value as Record<string, unknown>).combo === "string"
			) {
				merged[action] = { combo: (value as { combo: string }).combo };
			}
		}
	} catch {
		// Silently ignore invalid keybindings file
	}

	return merged;
}

/**
 * Get a parsed key combo for a given action, considering user overrides.
 */
export function getKeyCombo(
	keybindings: KeybindingMap,
	action: string,
): ParsedKeyCombo | undefined {
	const entry = keybindings[action];
	if (!entry) return undefined;
	return parseKeyCombo(entry.combo);
}

/**
 * Check if a key event matches the binding for a given action.
 */
export function matchesAction(
	key: { name: string; ctrl: boolean; meta: boolean; shift: boolean },
	keybindings: KeybindingMap,
	action: string,
): boolean {
	const combo = getKeyCombo(keybindings, action);
	if (!combo) return false;
	return matchesKeyCombo(key, combo);
}
