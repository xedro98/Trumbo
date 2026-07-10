/**
 * Project trust model.
 *
 * Before loading project-local extensions, skills, and config from `.trumbo/`,
 * the CLI checks whether the user has trusted this workspace. Trust decisions
 * are stored in `~/.trumbo/trust.json` keyed by workspace root path.
 *
 * Trust states:
 * - `ask` — prompt the user (default for first encounter)
 * - `always` — always trust this workspace
 * - `never` — never trust this workspace
 *
 * The `--trust` CLI flag can override: `--trust always`, `--trust never`,
 * `--trust ask`.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { resolveTrumboDir } from "@trumbo/shared/storage";

export type TrustDecision = "ask" | "always" | "never";

export interface TrustStore {
	/** Map of workspace root path → trust decision */
	decisions: Record<string, TrustDecision>;
}

const TRUST_FILE = "trust.json";

function trustFilePath(): string {
	return join(resolveTrumboDir(), TRUST_FILE);
}

/**
 * Load the trust store from disk.
 *
 * Returns an empty store if the file doesn't exist or is invalid.
 */
export function loadTrustStore(): TrustStore {
	const path = trustFilePath();
	if (!existsSync(path)) {
		return { decisions: {} };
	}
	try {
		const raw = readFileSync(path, "utf8");
		const parsed = JSON.parse(raw) as Partial<TrustStore>;
		return {
			decisions:
				parsed.decisions && typeof parsed.decisions === "object"
					? parsed.decisions
					: {},
		};
	} catch {
		return { decisions: {} };
	}
}

/**
 * Save the trust store to disk.
 */
export function saveTrustStore(store: TrustStore): void {
	const path = trustFilePath();
	try {
		mkdirSync(dirname(path), { recursive: true });
		writeFileSync(path, `${JSON.stringify(store, null, 2)}\n`, "utf8");
	} catch {
		// Non-fatal: trust is a convenience, not critical
	}
}

/**
 * Get the trust decision for a workspace.
 *
 * @param workspaceRoot The resolved workspace root path
 * @returns The trust decision, or "ask" if not set
 */
export function getTrustDecision(workspaceRoot: string): TrustDecision {
	const store = loadTrustStore();
	const normalized = resolve(workspaceRoot);
	return store.decisions[normalized] ?? "ask";
}

/**
 * Set the trust decision for a workspace.
 *
 * @param workspaceRoot The resolved workspace root path
 * @param decision The trust decision to set
 */
export function setTrustDecision(
	workspaceRoot: string,
	decision: TrustDecision,
): void {
	const store = loadTrustStore();
	const normalized = resolve(workspaceRoot);
	store.decisions[normalized] = decision;
	saveTrustStore(store);
}

/**
 * Check whether a workspace is trusted (either "always" or explicitly via CLI override).
 *
 * @param workspaceRoot The workspace root path
 * @param override Optional CLI override (`--trust always|never|ask`)
 * @returns `true` if the workspace should be trusted, `false` otherwise
 */
export function isWorkspaceTrusted(
	workspaceRoot: string,
	override?: TrustDecision,
): boolean {
	const decision = override ?? getTrustDecision(workspaceRoot);
	return decision === "always";
}

/**
 * Clear the trust decision for a workspace.
 */
export function clearTrustDecision(workspaceRoot: string): void {
	const store = loadTrustStore();
	const normalized = resolve(workspaceRoot);
	delete store.decisions[normalized];
	saveTrustStore(store);
}
