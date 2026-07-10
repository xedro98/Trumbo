/**
 * Session conversation tree model.
 *
 * A session stores its conversation as a tree of entries. Each entry has a
 * unique `id` and a `parentId` pointing to its parent in the tree. The
 * `activeLeafId` tracks the current position — the leaf of the branch the
 * user is currently on.
 *
 * Linear sessions (the historical format) are a degenerate tree: a single
 * branch (linked list) where each entry's `parentId` is the previous
 * entry's `id`.
 *
 * This module provides pure, side-effect-free utilities for building,
 * navigating, and mutating conversation trees. The storage layer
 * (`@trumbo/core`) uses these to persist and restore branched sessions.
 *
 * @see TRU-22 — Session tree data model
 * @see https://pi.dev/docs/latest/sessions — Pi's session tree reference
 */

import type { MessageWithMetadata } from "../llms/messages";

/**
 * A conversation entry in the session tree.
 *
 * This is a `MessageWithMetadata` that uses its `parentId` field to link to
 * its parent in the tree. When `parentId` is `null` or `undefined`, the entry
 * is a root (the first message in the conversation).
 */
export type SessionTreeEntry = MessageWithMetadata;

/**
 * A node in the session tree, with references to its children.
 *
 * Built by `buildSessionTree` from a flat array of entries. Useful for
 * tree-structured rendering in the TUI (`/tree` navigator).
 */
export interface SessionTreeNode {
	entry: SessionTreeEntry;
	children: SessionTreeNode[];
}

/**
 * The full session tree: all entries plus the active leaf pointer.
 *
 * This is the in-memory representation. On disk, entries are stored as a
 * flat array (each with `parentId`), and `activeLeafId` is a top-level
 * field in the messages file.
 */
export interface SessionTree {
	entries: SessionTreeEntry[];
	activeLeafId?: string;
}

/**
 * Result of migrating a linear (v1) message array to tree entries.
 */
export interface MigratedSessionTree {
	entries: SessionTreeEntry[];
	activeLeafId?: string;
}

/**
 * Build a tree structure from a flat array of entries.
 *
 * Entries without a `parentId` (or with `parentId === null`) are treated as
 * roots. If multiple roots exist, they are returned as children of a single
 * synthetic root node with `entry.id = ""`.
 *
 * Entries with a `parentId` that doesn't match any entry's `id` are treated
 * as roots (orphaned entries are not silently dropped).
 *
 * @returns An array of root nodes. Each node contains its entry and
 *   recursively its children.
 */
export function buildSessionTree(
	entries: readonly SessionTreeEntry[],
): SessionTreeNode[] {
	const byId = new Map<string, SessionTreeNode>();
	const roots: SessionTreeNode[] = [];
	const orphans: SessionTreeNode[] = [];

	for (const entry of entries) {
		const nodeId = entry.id ?? "";
		if (!nodeId) continue;
		byId.set(nodeId, { entry, children: [] });
	}

	for (const entry of entries) {
		const nodeId = entry.id ?? "";
		if (!nodeId) continue;
		const node = byId.get(nodeId);
		if (!node) continue;
		const parentId = entry.parentId ?? null;

		if (parentId === null || parentId === undefined) {
			roots.push(node);
			continue;
		}

		const parent = byId.get(parentId);
		if (parent) {
			parent.children.push(node);
		} else {
			roots.push(node);
			orphans.push(node);
		}
	}

	return roots;
}

/**
 * Get the path from the root to a specific entry (inclusive).
 *
 * Traverses upward from the target entry via `parentId` links until reaching
 * a root. Returns the path in chronological order (root first, target last).
 *
 * @returns The path entries, or `[]` if the entry is not found or a cycle is
 *   detected.
 */
export function getAncestorPath(
	entries: readonly SessionTreeEntry[],
	entryId: string,
): SessionTreeEntry[] {
	const byId = new Map<string, SessionTreeEntry>();
	for (const entry of entries) {
		if (entry.id) {
			byId.set(entry.id, entry);
		}
	}

	const target = byId.get(entryId);
	if (!target) return [];

	const path: SessionTreeEntry[] = [];
	const visited = new Set<string>();
	let current: SessionTreeEntry | undefined = target;

	while (current) {
		if (current.id && visited.has(current.id)) break;
		if (current.id) visited.add(current.id);
		path.unshift(current);
		const parentId: string | null | undefined = current.parentId ?? null;
		current =
			parentId !== null && parentId !== undefined
				? byId.get(parentId)
				: undefined;
	}

	return path;
}

/**
 * Get the active path: the path from root to the active leaf.
 *
 * If `activeLeafId` is not set or doesn't match any entry, falls back to the
 * last entry in the array (preserving the linear behavior).
 *
 * @returns The active path entries in chronological order.
 */
export function getActivePath(
	entries: readonly SessionTreeEntry[],
	activeLeafId?: string,
): SessionTreeEntry[] {
	if (entries.length === 0) return [];

	// For linear sessions (v1, no parentId on any entry), the active path
	// is the entire array in order. This preserves backward compatibility
	// with pre-tree sessions.
	const hasTreeLinks = entries.some(
		(e) => e.parentId !== undefined && e.parentId !== null,
	);
	if (!hasTreeLinks) return [...entries];

	const leafId =
		activeLeafId && activeLeafId.trim()
			? activeLeafId.trim()
			: entries[entries.length - 1]?.id;

	if (!leafId) return [...entries];

	const path = getAncestorPath(entries, leafId);
	return path.length > 0 ? path : [...entries];
}

/**
 * Get all direct children of an entry.
 *
 * @param entries All session entries.
 * @param parentId The parent entry's `id`.
 * @returns Children of the parent, in array order.
 */
export function getChildren(
	entries: readonly SessionTreeEntry[],
	parentId: string,
): SessionTreeEntry[] {
	return entries.filter((entry) => (entry.parentId ?? null) === parentId);
}

/**
 * Get all leaf entry IDs (entries that have no children).
 *
 * A leaf is an entry whose `id` does not appear as any other entry's
 * `parentId`. These are the branch tips — potential active leaf targets.
 *
 * @returns Array of leaf entry IDs.
 */
export function getLeafEntryIds(
	entries: readonly SessionTreeEntry[],
): string[] {
	const parentIds = new Set<string>();
	for (const entry of entries) {
		const pid = entry.parentId ?? null;
		if (pid) parentIds.add(pid);
	}
	return entries
		.map((entry) => entry.id)
		.filter((id): id is string => !!id && !parentIds.has(id));
}

/**
 * Get all descendants of an entry (children, grandchildren, etc.).
 *
 * Uses iterative BFS to avoid stack overflow on deep trees.
 *
 * @returns All descendant entries (not including the entry itself).
 */
export function getDescendants(
	entries: readonly SessionTreeEntry[],
	entryId: string,
): SessionTreeEntry[] {
	const childrenByParent = new Map<string, SessionTreeEntry[]>();
	for (const entry of entries) {
		const pid = entry.parentId ?? null;
		if (pid) {
			const siblings = childrenByParent.get(pid) ?? [];
			siblings.push(entry);
			childrenByParent.set(pid, siblings);
		}
	}

	const descendants: SessionTreeEntry[] = [];
	const queue: string[] = [entryId];
	const visited = new Set<string>([entryId]);

	while (queue.length > 0) {
		const currentId = queue.shift();
		if (currentId === undefined) break;
		const children = childrenByParent.get(currentId) ?? [];
		for (const child of children) {
			if (child.id && !visited.has(child.id)) {
				visited.add(child.id);
				descendants.push(child);
				queue.push(child.id);
			}
		}
	}

	return descendants;
}

/**
 * Switch the active leaf to a different entry.
 *
 * Validates that the target entry exists. Does NOT mutate the entries —
 * returns the new `activeLeafId` for the caller to apply.
 *
 * @returns The new `activeLeafId`, or `undefined` if the entry doesn't exist.
 */
export function switchLeaf(
	entries: readonly SessionTreeEntry[],
	targetEntryId: string,
): string | undefined {
	return entries.some((entry) => entry.id === targetEntryId)
		? targetEntryId
		: undefined;
}

/**
 * Migrate a linear (v1) message array to tree entries.
 *
 * Each message gets its `parentId` set to the previous message's `id`. If a
 * message has no `id`, one is generated via the provided `generateId` function
 * (defaults to a simple counter-based ID).
 *
 * The `activeLeafId` is set to the last entry's `id`.
 *
 * @param messages The flat v1 message array (no parent links).
 * @param generateId Optional ID generator for messages without IDs.
 * @returns Tree entries with parent links + the active leaf ID.
 */
export function migrateLinearToTree(
	messages: readonly MessageWithMetadata[],
	generateId?: () => string,
): MigratedSessionTree {
	if (messages.length === 0) {
		return { entries: [], activeLeafId: undefined };
	}

	const genId = generateId ?? defaultGenerateId;
	const entries: SessionTreeEntry[] = [];
	let previousId: string | null = null;

	for (const message of messages) {
		const id = message.id ?? genId();
		entries.push({
			...message,
			id,
			parentId: previousId,
		});
		previousId = id;
	}

	const activeLeafId = entries[entries.length - 1]?.id;
	return { entries, activeLeafId };
}

/**
 * Validate the integrity of a session tree.
 *
 * Checks for:
 * - Duplicate entry IDs
 * - Dangling parent references (parentId points to non-existent entry)
 * - Cycles (entry's ancestor chain includes itself)
 *
 * @returns `{ valid: true }` or `{ valid: false, errors: string[] }`.
 */
export function validateSessionTree(entries: readonly SessionTreeEntry[]): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];
	const ids = new Set<string>();
	const byId = new Map<string, SessionTreeEntry>();

	for (const entry of entries) {
		const id = entry.id;
		if (!id) {
			errors.push("Entry missing required field: id");
			continue;
		}
		if (ids.has(id)) {
			errors.push(`Duplicate entry ID: ${id}`);
		}
		ids.add(id);
		byId.set(id, entry);
	}

	for (const entry of entries) {
		if (!entry.id) continue;
		const parentId = entry.parentId ?? null;
		if (parentId === null || parentId === undefined) continue;
		if (!byId.has(parentId)) {
			errors.push(`Entry ${entry.id} has dangling parentId: ${parentId}`);
			continue;
		}
		const visited = new Set<string>([entry.id]);
		let current: SessionTreeEntry | undefined = entry;
		while (current) {
			const pid = current.parentId ?? null;
			if (pid === null || pid === undefined) break;
			if (visited.has(pid)) {
				errors.push(`Cycle detected at entry ${entry.id} -> ${pid}`);
				break;
			}
			visited.add(pid);
			current = byId.get(pid);
		}
	}

	return { valid: errors.length === 0, errors };
}

let defaultIdCounter = 0;

function defaultGenerateId(): string {
	defaultIdCounter += 1;
	return `entry_${Date.now().toString(36)}_${defaultIdCounter.toString(36)}`;
}

/**
 * Reset the internal ID counter. Only for testing.
 */
export function _resetIdCounterForTest(): void {
	defaultIdCounter = 0;
}
