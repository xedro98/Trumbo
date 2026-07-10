/**
 * Per-session conversation transcript store with tree support.
 *
 * The store maintains two concepts:
 *
 * 1. **entries** — the full set of conversation entries (all branches). Each
 *    entry has an `id` and a `parentId` linking it to its parent in the tree.
 * 2. **activeLeafId** — the current position in the tree. The "active path"
 *    is the chain of entries from the root to the active leaf.
 *
 * In linear mode (the default for sessions that haven't been branched), the
 * entries form a linked list and the active path is the entire list. This is
 * backward compatible with the pre-tree behavior: `getMessages()` returns
 * the same flat array it always did.
 *
 * Tree mode is activated when `switchLeaf` or `branchFrom` is called. In tree
 * mode, `getMessages()` returns only the active path (root to leaf), while
 * `getEntries()` returns all entries including abandoned branches.
 *
 * @see TRU-22 — Session tree data model
 * @see session-tree.ts in @trumbo/shared for pure tree utilities
 */

import type { MessageWithMetadata, SessionTreeEntry } from "@trumbo/shared";
import { getActivePath } from "@trumbo/shared";
import { nanoid } from "nanoid";

/** Generate a fresh conversation id. Exported for reuse by `SessionRuntime`. */
export function createConversationId(): string {
	return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export interface ConversationStoreRestoreOptions {
	activeLeafId?: string;
}

export class ConversationStore {
	private entries: SessionTreeEntry[] = [];
	private conversationId = createConversationId();
	private sessionStarted = false;
	private activeLeafId: string | undefined;

	constructor(
		initialMessages?: readonly MessageWithMetadata[],
		options?: ConversationStoreRestoreOptions,
	) {
		if ((initialMessages?.length ?? 0) > 0) {
			this.restore(initialMessages ?? [], options);
		}
	}

	getConversationId(): string {
		return this.conversationId;
	}

	/**
	 * Returns the active path: messages from the root to the active leaf.
	 *
	 * In linear mode (no branching), this is the entire entry list.
	 * In tree mode, this is only the current branch.
	 */
	getMessages(): MessageWithMetadata[] {
		return getActivePath(this.entries, this.activeLeafId);
	}

	/**
	 * Returns all entries in the session tree, including abandoned branches.
	 */
	getEntries(): SessionTreeEntry[] {
		return [...this.entries];
	}

	/**
	 * Returns the active leaf entry ID.
	 */
	getActiveLeafId(): string | undefined {
		return this.activeLeafId;
	}

	/**
	 * Append a message to the active branch.
	 *
	 * The message's `parentId` is set to the current active leaf ID (or `null`
	 * if the tree is empty). The active leaf is updated to the new entry.
	 * If the message has no `id`, one is generated.
	 */
	appendMessage(message: MessageWithMetadata): void {
		const id = message.id ?? nanoid();
		const parentId = this.activeLeafId ?? null;
		const entry: SessionTreeEntry = {
			...message,
			id,
			parentId,
		};
		this.entries.push(entry);
		this.activeLeafId = id;
	}

	appendMessages(messages: readonly MessageWithMetadata[]): void {
		for (const message of messages) {
			this.appendMessage(message);
		}
	}

	/**
	 * Replace the active path with a new set of messages.
	 *
	 * In linear mode, this replaces all entries. Each new message is linked to
	 * the previous one in a chain, and the active leaf is set to the last
	 * message.
	 *
	 * In tree mode, only the active path entries are removed; entries from
	 * other branches are preserved. The new messages are linked in a chain,
	 * with the first message's `parentId` set to the parent of the first
	 * removed entry.
	 */
	replaceMessages(messages: readonly MessageWithMetadata[]): void {
		const activePath = this.getActivePathIds();
		const activePathSet = new Set(activePath);

		const branchRootParentId =
			activePath.length > 0
				? (this.entries.find((e) => e.id === activePath[0])?.parentId ?? null)
				: null;

		this.entries = this.entries.filter(
			(e) => !e.id || !activePathSet.has(e.id),
		);

		let previousId: string | null = branchRootParentId;
		for (const message of messages) {
			const id = message.id ?? nanoid();
			this.entries.push({
				...message,
				id,
				parentId: previousId,
			});
			previousId = id;
		}
		this.activeLeafId = previousId ?? undefined;
	}

	/**
	 * Switch the active leaf to a different entry.
	 *
	 * The target entry must exist in the tree. After switching, `getMessages()`
	 * returns the path from the root to the new leaf.
	 *
	 * @returns `true` if the switch succeeded, `false` if the entry was not found.
	 */
	switchLeaf(entryId: string): boolean {
		if (!this.entries.some((e) => e.id === entryId)) {
			return false;
		}
		this.activeLeafId = entryId;
		return true;
	}

	/**
	 * Branch from a specific entry: switch the active leaf to that entry so
	 * the next `appendMessage` creates a new branch.
	 *
	 * This is the in-place branching operation (Pi's `/tree` equivalent).
	 * Unlike `/fork`, no new session file is created — the branch lives in
	 * the same entry list.
	 *
	 * @returns `true` if the branch point exists, `false` otherwise.
	 */
	branchFrom(entryId: string): boolean {
		return this.switchLeaf(entryId);
	}

	resetForRun(): void {
		this.entries = [];
		this.conversationId = createConversationId();
		this.sessionStarted = false;
		this.activeLeafId = undefined;
	}

	clearHistory(): void {
		this.entries = [];
		this.conversationId = createConversationId();
		this.sessionStarted = false;
		this.activeLeafId = undefined;
	}

	/**
	 * Restore messages from a persisted session.
	 *
	 * If `activeLeafId` is provided, the tree is restored with that leaf as
	 * the active position. Otherwise, the last entry is used as the leaf.
	 *
	 * Messages that have `parentId` set are treated as tree entries directly.
	 * Messages without `parentId` are linked in a chain (v1 migration).
	 */
	restore(
		messages: readonly MessageWithMetadata[],
		options?: ConversationStoreRestoreOptions,
	): void {
		const hasTreeLinks = messages.some(
			(m) => m.parentId !== undefined && m.parentId !== null,
		);

		if (hasTreeLinks) {
			this.entries = messages.map((m) => ({
				...m,
				id: m.id ?? nanoid(),
				parentId: m.parentId ?? null,
			}));
			this.activeLeafId =
				options?.activeLeafId?.trim() ||
				this.entries[this.entries.length - 1]?.id;
		} else {
			this.entries = [];
			let previousId: string | null = null;
			for (const message of messages) {
				const id = message.id ?? nanoid();
				this.entries.push({
					...message,
					id,
					parentId: previousId,
				});
				previousId = id;
			}
			this.activeLeafId =
				options?.activeLeafId?.trim() ||
				this.entries[this.entries.length - 1]?.id;
		}
		this.sessionStarted = false;
	}

	isSessionStarted(): boolean {
		return this.sessionStarted;
	}

	markSessionStarted(): void {
		this.sessionStarted = true;
	}

	/**
	 * Returns the IDs of entries in the active path (root to leaf).
	 */
	private getActivePathIds(): string[] {
		const activePath = getActivePath(this.entries, this.activeLeafId);
		return activePath.map((e) => e.id).filter((id): id is string => !!id);
	}
}
