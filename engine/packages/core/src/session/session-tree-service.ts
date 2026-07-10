/**
 * Session tree service — high-level API for conversation tree operations.
 *
 * Wraps the TRU-22 tree primitives (`@trumbo/shared/session-tree`) with a
 * host-backed service that reads from and persists to disk. This is the
 * API surface that `TrumboCore.tree` exposes, and that the hub/dashboard
 * can call over RPC.
 *
 * ## Design
 *
 * The service is stateless: every call reads from the host's session
 * messages file, computes the result using the pure shared utilities, and
 * (for mutations) persists back. This keeps it consistent with the
 * existing `SessionVersioningService` pattern and safe for concurrent
 * access from multiple clients (hub, CLI, dashboard).
 *
 * ## RPC readiness
 *
 * All return types are plain serializable objects (no class instances,
 * no Maps, no functions). `SessionTreeSnapshot` is the canonical
 * envelope for tree reads.
 *
 * @see TRU-21 — SessionManager tree API
 * @see session-tree.ts in @trumbo/shared for pure tree utilities
 * @see ConversationStore for the in-memory tree wrapper used by live sessions
 */

import type * as LlmsProviders from "@trumbo/llms";
import type {
	MessageWithMetadata,
	SessionTreeEntry,
	SessionTreeNode,
} from "@trumbo/shared";
import {
	buildSessionTree,
	getActivePath,
	getAncestorPath,
	getChildren,
	getDescendants,
	getLeafEntryIds,
	switchLeaf as sharedSwitchLeaf,
	validateSessionTree,
} from "@trumbo/shared";

/**
 * Serializable snapshot of a session's conversation tree.
 *
 * Returned by `getSnapshot` and used as the canonical read result.
 */
export interface SessionTreeSnapshot {
	sessionId: string;
	/** All entries in the tree, including abandoned branches. */
	entries: SessionTreeEntry[];
	/** The active leaf entry ID (current position). */
	activeLeafId?: string;
	/** The active path: entries from root to the active leaf. */
	activePath: SessionTreeEntry[];
}

/**
 * Result of a tree validation check.
 */
export interface SessionTreeValidationResult {
	valid: boolean;
	errors: string[];
}

/**
 * Host interface required by `SessionTreeService`.
 *
 * `LocalRuntimeHost` implements this directly. Hub/remote hosts would
 * need to proxy these methods over WebSocket (future work).
 */
export interface SessionTreeHost {
	readSessionTree(sessionId: string): Promise<{
		messages: LlmsProviders.Message[];
		activeLeafId?: string;
	}>;
	persistSessionTree(
		sessionId: string,
		messages: LlmsProviders.Message[],
		activeLeafId?: string,
		systemPrompt?: string,
	): Promise<void>;
}

/**
 * Check whether a host implements the `SessionTreeHost` interface.
 */
export function hostSupportsSessionTree(
	host: unknown,
): host is SessionTreeHost {
	if (!host || typeof host !== "object") return false;
	const candidate = host as Record<string, unknown>;
	return (
		typeof candidate.readSessionTree === "function" &&
		typeof candidate.persistSessionTree === "function"
	);
}

/**
 * High-level conversation tree service.
 *
 * All methods are async and operate on persisted session data. For live
 * (in-memory) session trees, use `ConversationStore` directly.
 *
 * @example
 * ```ts
 * const tree = new SessionTreeService(host);
 *
 * // Get the full tree snapshot
 * const snapshot = await tree.getSnapshot(sessionId);
 * console.log(snapshot.activeLeafId);
 *
 * // Switch to a different branch
 * await tree.switchLeaf(sessionId, "entry-abc");
 *
 * // Get the tree structure for rendering
 * const nodes = await tree.getTree(sessionId);
 * ```
 */
export class SessionTreeService {
	constructor(private readonly host: SessionTreeHost) {}

	/**
	 * Read the full session tree snapshot: all entries, the active leaf,
	 * and the active path.
	 */
	async getSnapshot(sessionId: string): Promise<SessionTreeSnapshot> {
		const { messages, activeLeafId } =
			await this.host.readSessionTree(sessionId);
		const entries = messages as SessionTreeEntry[];
		const activePath = getActivePath(entries, activeLeafId);
		return {
			sessionId,
			entries,
			activeLeafId,
			activePath,
		};
	}

	/**
	 * Get the tree structure (root nodes with children) for rendering.
	 */
	async getTree(sessionId: string): Promise<SessionTreeNode[]> {
		const { messages } = await this.host.readSessionTree(sessionId);
		return buildSessionTree(messages as SessionTreeEntry[]);
	}

	/**
	 * Get all entries in the session tree (flat array, including abandoned
	 * branches).
	 */
	async getEntries(sessionId: string): Promise<SessionTreeEntry[]> {
		const { messages } = await this.host.readSessionTree(sessionId);
		return messages as SessionTreeEntry[];
	}

	/**
	 * Get the active path: messages from the root to the active leaf.
	 * This is what the agent sees as its conversation.
	 */
	async getActivePath(sessionId: string): Promise<MessageWithMetadata[]> {
		const { messages, activeLeafId } =
			await this.host.readSessionTree(sessionId);
		return getActivePath(messages as SessionTreeEntry[], activeLeafId);
	}

	/**
	 * Get the active leaf entry ID (the current position in the tree).
	 */
	async getActiveLeafId(sessionId: string): Promise<string | undefined> {
		const { activeLeafId } = await this.host.readSessionTree(sessionId);
		return activeLeafId;
	}

	/**
	 * Get all leaf entry IDs (branch tips — potential active leaf targets).
	 */
	async getLeafEntryIds(sessionId: string): Promise<string[]> {
		const { messages } = await this.host.readSessionTree(sessionId);
		return getLeafEntryIds(messages as SessionTreeEntry[]);
	}

	/**
	 * Get all direct children of an entry.
	 */
	async getChildren(
		sessionId: string,
		entryId: string,
	): Promise<SessionTreeEntry[]> {
		const { messages } = await this.host.readSessionTree(sessionId);
		return getChildren(messages as SessionTreeEntry[], entryId);
	}

	/**
	 * Get all descendants of an entry (children, grandchildren, etc.).
	 */
	async getDescendants(
		sessionId: string,
		entryId: string,
	): Promise<SessionTreeEntry[]> {
		const { messages } = await this.host.readSessionTree(sessionId);
		return getDescendants(messages as SessionTreeEntry[], entryId);
	}

	/**
	 * Get the path from the root to a specific entry (inclusive).
	 */
	async getAncestorPath(
		sessionId: string,
		entryId: string,
	): Promise<SessionTreeEntry[]> {
		const { messages } = await this.host.readSessionTree(sessionId);
		return getAncestorPath(messages as SessionTreeEntry[], entryId);
	}

	/**
	 * Switch the active leaf to a different entry.
	 *
	 * Validates that the target entry exists, then persists the updated
	 * `activeLeafId`. The messages themselves are not modified — only the
	 * active position pointer changes.
	 *
	 * @returns `true` if the switch succeeded, `false` if the entry was
	 *   not found or the session is empty.
	 */
	async switchLeaf(sessionId: string, entryId: string): Promise<boolean> {
		const { messages, activeLeafId: currentLeafId } =
			await this.host.readSessionTree(sessionId);

		if (messages.length === 0) return false;

		const entries = [...(messages as SessionTreeEntry[])];
		let summaryText: string | undefined;
		if (currentLeafId && currentLeafId !== entryId) {
			const abandonedPath = getAncestorPath(entries, currentLeafId);
			const userMessages = abandonedPath.filter(
				(e) =>
					e.role === "user" &&
					e.entryKind !== "label" &&
					e.entryKind !== "branchSummary",
			);
			const lastUser = userMessages[userMessages.length - 1];
			const lastText =
				typeof lastUser?.content === "string"
					? lastUser.content.slice(0, 120)
					: (lastUser?.content
							?.find((b) => b.type === "text")
							?.text?.slice(0, 120) ?? "");
			summaryText = `Switched from a branch with ${abandonedPath.length} entries.${
				lastText ? ` Last user request: "${lastText}".` : ""
			}`;
		}

		const newLeafId = sharedSwitchLeaf(entries, entryId);
		if (!newLeafId) return false;

		if (newLeafId === currentLeafId) return true;

		// Inject a branch summary entry so the new active path carries context
		// from the abandoned branch.
		let finalLeafId = newLeafId;
		if (summaryText) {
			const summaryId = crypto.randomUUID();
			entries.push({
				id: summaryId,
				parentId: newLeafId,
				role: "user",
				content: [{ type: "text", text: summaryText }],
				entryKind: "branchSummary",
				summaryText,
			});
			finalLeafId = summaryId;
		}

		await this.host.persistSessionTree(sessionId, entries, finalLeafId);
		return true;
	}

	/**
	 * Branch from a specific entry: switch the active leaf to that entry
	 * so the next appended message creates a new branch.
	 *
	 * This is the in-place branching operation (Pi's `/tree` equivalent).
	 * Unlike `/fork`, no new session file is created — the branch lives in
	 * the same entry list.
	 *
	 * @returns `true` if the branch point exists, `false` otherwise.
	 */
	async branchFrom(sessionId: string, entryId: string): Promise<boolean> {
		return this.switchLeaf(sessionId, entryId);
	}

	/**
	 * Validate the integrity of a session tree.
	 *
	 * Checks for duplicate entry IDs, dangling parent references, and
	 * cycles.
	 */
	async validateTree(sessionId: string): Promise<SessionTreeValidationResult> {
		const { messages } = await this.host.readSessionTree(sessionId);
		return validateSessionTree(messages as SessionTreeEntry[]);
	}
}
