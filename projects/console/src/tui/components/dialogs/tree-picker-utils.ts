/**
 * Pure utility functions for the tree picker dialog.
 *
 * Separated from `tree-picker.tsx` so they can be unit-tested without
 * the OpenTUI runtime (which requires a terminal).
 */
import type { MessageWithMetadata } from "@trumbo/shared";

export interface TreePickerItem {
	id: string;
	parentId: string | null;
	role: "user" | "assistant";
	content: string;
	isActiveLeaf: boolean;
	isOnActivePath: boolean;
	depth: number;
	hasChildren: boolean;
	isBranch: boolean;
	label?: string;
}

export function extractText(message: MessageWithMetadata): string {
	if (typeof message.content === "string") {
		return message.content;
	}
	const parts: string[] = [];
	for (const block of message.content) {
		if (block.type === "text") {
			parts.push(block.text);
		} else if (block.type === "tool_use") {
			parts.push(`[${block.name}]`);
		} else if (block.type === "tool_result") {
			parts.push(`[result: ${block.name}]`);
		} else if (block.type === "thinking") {
			parts.push(`[thinking]`);
		}
	}
	return parts.join(" ") || "(empty)";
}

export function hasToolContent(message: MessageWithMetadata): boolean {
	if (typeof message.content === "string") return false;
	return message.content.some(
		(block) => block.type === "tool_use" || block.type === "tool_result",
	);
}

/**
 * Build a flat, indented list of tree entries for display.
 *
 * Traverses the tree depth-first from roots, computing depth and
 * branch/path markers for each entry.
 */
export function buildTreePickerItems(
	entries: MessageWithMetadata[],
	activeLeafId?: string,
): TreePickerItem[] {
	const byParent = new Map<string | null, MessageWithMetadata[]>();
	for (const entry of entries) {
		const parentId = entry.parentId ?? null;
		const siblings = byParent.get(parentId) ?? [];
		siblings.push(entry);
		byParent.set(parentId, siblings);
	}

	const activePathIds = new Set<string>();
	if (activeLeafId) {
		let current: MessageWithMetadata | undefined = entries.find(
			(e) => e.id === activeLeafId,
		);
		const visited = new Set<string>();
		while (current?.id && !visited.has(current.id)) {
			visited.add(current.id);
			activePathIds.add(current.id);
			const pid = current.parentId ?? null;
			current = pid !== null ? entries.find((e) => e.id === pid) : undefined;
		}
	}

	const items: TreePickerItem[] = [];
	const visited = new Set<string>();

	const entryIds = new Set(
		entries.map((e) => e.id).filter((id): id is string => !!id),
	);

	function traverse(parentId: string | null, depth: number) {
		const children = byParent.get(parentId) ?? [];
		for (const child of children) {
			if (!child.id || visited.has(child.id)) continue;
			visited.add(child.id);
			const childChildren = byParent.get(child.id) ?? [];
			items.push({
				id: child.id,
				parentId,
				role: child.role,
				content: extractText(child),
				isActiveLeaf: child.id === activeLeafId,
				isOnActivePath: activePathIds.has(child.id),
				depth,
				hasChildren: childChildren.length > 0,
				isBranch: childChildren.length > 1,
				label: undefined,
			});
			traverse(child.id, depth + 1);
		}
	}

	traverse(null, 0);

	if (items.length === 0 && entries.length > 0) {
		const orphanRoots = entries.filter(
			(e) =>
				e.id &&
				(e.parentId === null ||
					e.parentId === undefined ||
					!entryIds.has(e.parentId)),
		);
		if (orphanRoots.length > 0) {
			for (const root of orphanRoots) {
				if (root.id) traverse(root.id, 0);
			}
		} else {
			for (const entry of entries) {
				if (entry.id && !visited.has(entry.id)) {
					traverse(entry.id, 0);
				}
			}
		}
	}
	return items;
}
