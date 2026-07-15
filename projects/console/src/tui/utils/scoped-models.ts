/**
 * Scoped models — allow users to define a subset of models for quick cycling.
 *
 * Users can configure scoped models in `~/.trumbo/scoped-models.json`:
 *
 * ```json
 * {
 *   "models": [
 *     "anthropic/claude-sonnet-4-20250514",
 *     "openai/gpt-5.3-codex",
 *     "google/gemini-2.5-pro"
 *   ]
 * }
 * ```
 *
 * The TUI cycles through these with a dedicated shortcut (Ctrl+M by default,
 * or whatever the user configures in keybindings.json).
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { resolveTrumboDir } from "@trumbodev/shared/storage";

export interface ScopedModelsConfig {
	models: string[];
}

let cachedConfig: ScopedModelsConfig | undefined;

/**
 * Load scoped models from `~/.trumbo/scoped-models.json`.
 *
 * Returns an empty config if the file doesn't exist or is invalid.
 */
export function loadScopedModels(): ScopedModelsConfig {
	if (cachedConfig !== undefined) return cachedConfig;

	const path = join(resolveTrumboDir(), "scoped-models.json");
	if (!existsSync(path)) {
		cachedConfig = { models: [] };
		return cachedConfig;
	}

	try {
		const raw = readFileSync(path, "utf8");
		const parsed = JSON.parse(raw) as Partial<ScopedModelsConfig>;
		cachedConfig = {
			models:
				Array.isArray(parsed.models) &&
				parsed.models.every((m) => typeof m === "string")
					? parsed.models
					: [],
		};
		return cachedConfig;
	} catch {
		cachedConfig = { models: [] };
		return cachedConfig;
	}
}

/**
 * Get the next model in the scoped models cycle.
 *
 * @param currentModelId The currently selected model ID
 * @returns The next model ID, or `undefined` if no scoped models are configured
 */
export function getNextScopedModel(currentModelId: string): string | undefined {
	const config = loadScopedModels();
	if (config.models.length === 0) return undefined;

	const currentIndex = config.models.indexOf(currentModelId);
	if (currentIndex === -1) {
		return config.models[0];
	}
	const nextIndex = (currentIndex + 1) % config.models.length;
	return config.models[nextIndex];
}

/**
 * Reset the cached config. Only for testing.
 */
export function _resetScopedModelsCacheForTest(): void {
	cachedConfig = undefined;
}
