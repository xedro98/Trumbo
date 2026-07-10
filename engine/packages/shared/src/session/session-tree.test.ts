import { describe, expect, it } from "vitest";
import type { MessageWithMetadata, SessionTreeEntry } from "./session-tree";
import {
	_resetIdCounterForTest,
	buildSessionTree,
	getActivePath,
	getAncestorPath,
	getChildren,
	getDescendants,
	getLeafEntryIds,
	migrateLinearToTree,
	switchLeaf,
	validateSessionTree,
} from "./session-tree";

function makeEntry(
	id: string,
	parentId: string | null,
	role: "user" | "assistant" = "user",
	content = "test",
): SessionTreeEntry {
	return {
		id,
		parentId,
		role,
		content,
	};
}

describe("buildSessionTree", () => {
	it("builds a simple linked-list tree", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
		];

		const roots = buildSessionTree(entries);

		expect(roots).toHaveLength(1);
		expect(roots[0]?.entry.id).toBe("a");
		expect(roots[0]?.children).toHaveLength(1);
		expect(roots[0]?.children[0]?.entry.id).toBe("b");
		expect(roots[0]?.children[0]?.children).toHaveLength(1);
		expect(roots[0]?.children[0]?.children[0]?.entry.id).toBe("c");
	});

	it("builds a branching tree", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
			makeEntry("d", "b"),
			makeEntry("e", "a"),
		];

		const roots = buildSessionTree(entries);

		expect(roots).toHaveLength(1);
		expect(roots[0]?.entry.id).toBe("a");
		expect(roots[0]?.children).toHaveLength(2);

		const childB = roots[0]?.children.find((c) => c.entry.id === "b");
		const childE = roots[0]?.children.find((c) => c.entry.id === "e");
		expect(childB?.children).toHaveLength(2);
		expect(childE?.children).toHaveLength(0);
	});

	it("treats orphaned entries as roots", () => {
		const entries = [makeEntry("a", null), makeEntry("b", "nonexistent")];

		const roots = buildSessionTree(entries);

		expect(roots).toHaveLength(2);
		expect(roots.map((r) => r.entry.id).sort()).toEqual(["a", "b"]);
	});

	it("handles multiple roots", () => {
		const entries = [makeEntry("a", null), makeEntry("b", null)];

		const roots = buildSessionTree(entries);

		expect(roots).toHaveLength(2);
	});

	it("returns empty array for empty entries", () => {
		expect(buildSessionTree([])).toEqual([]);
	});
});

describe("getAncestorPath", () => {
	it("returns path from root to target", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
		];

		const path = getAncestorPath(entries, "c");

		expect(path.map((e) => e.id)).toEqual(["a", "b", "c"]);
	});

	it("returns single entry for root", () => {
		const entries = [makeEntry("a", null)];

		const path = getAncestorPath(entries, "a");

		expect(path.map((e) => e.id)).toEqual(["a"]);
	});

	it("returns empty for nonexistent entry", () => {
		const entries = [makeEntry("a", null)];

		const path = getAncestorPath(entries, "nonexistent");

		expect(path).toEqual([]);
	});

	it("handles branching correctly", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
			makeEntry("d", "b"),
		];

		const pathD = getAncestorPath(entries, "d");
		expect(pathD.map((e) => e.id)).toEqual(["a", "b", "d"]);

		const pathC = getAncestorPath(entries, "c");
		expect(pathC.map((e) => e.id)).toEqual(["a", "b", "c"]);
	});

	it("breaks on cycle", () => {
		const entries = [makeEntry("a", "b"), makeEntry("b", "a")];

		const path = getAncestorPath(entries, "a");

		expect(path.map((e) => e.id)).toEqual(["b", "a"]);
	});
});

describe("getActivePath", () => {
	it("returns path to active leaf", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
			makeEntry("d", "b"),
		];

		const path = getActivePath(entries, "d");

		expect(path.map((e) => e.id)).toEqual(["a", "b", "d"]);
	});

	it("falls back to last entry when no activeLeafId", () => {
		const entries = [makeEntry("a", null), makeEntry("b", "a")];

		const path = getActivePath(entries, undefined);

		expect(path.map((e) => e.id)).toEqual(["a", "b"]);
	});

	it("falls back to last entry when activeLeafId is empty string", () => {
		const entries = [makeEntry("a", null), makeEntry("b", "a")];

		const path = getActivePath(entries, "");

		expect(path.map((e) => e.id)).toEqual(["a", "b"]);
	});

	it("returns empty for empty entries", () => {
		expect(getActivePath([], "x")).toEqual([]);
	});

	it("falls back to full list when activeLeafId not found", () => {
		const entries = [makeEntry("a", null), makeEntry("b", "a")];

		const path = getActivePath(entries, "nonexistent");

		expect(path.map((e) => e.id)).toEqual(["a", "b"]);
	});
});

describe("getChildren", () => {
	it("returns direct children", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "a"),
			makeEntry("d", "b"),
		];

		const children = getChildren(entries, "a");

		expect(children.map((e) => e.id).sort()).toEqual(["b", "c"]);
	});

	it("returns empty for leaf entry", () => {
		const entries = [makeEntry("a", null), makeEntry("b", "a")];

		expect(getChildren(entries, "b")).toEqual([]);
	});
});

describe("getLeafEntryIds", () => {
	it("returns entries with no children", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
			makeEntry("d", "b"),
		];

		const leaves = getLeafEntryIds(entries);

		expect(leaves.sort()).toEqual(["c", "d"]);
	});

	it("returns root when single entry", () => {
		const entries = [makeEntry("a", null)];

		expect(getLeafEntryIds(entries)).toEqual(["a"]);
	});

	it("returns empty for empty entries", () => {
		expect(getLeafEntryIds([])).toEqual([]);
	});
});

describe("getDescendants", () => {
	it("returns all descendants recursively", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
			makeEntry("d", "b"),
			makeEntry("e", "a"),
		];

		const descendants = getDescendants(entries, "a");

		expect(descendants.map((e) => e.id).sort()).toEqual(["b", "c", "d", "e"]);
	});

	it("returns empty for leaf", () => {
		const entries = [makeEntry("a", null), makeEntry("b", "a")];

		expect(getDescendants(entries, "b")).toEqual([]);
	});

	it("handles cycles gracefully", () => {
		const entries = [makeEntry("a", "b"), makeEntry("b", "a")];

		const descendants = getDescendants(entries, "a");

		expect(descendants.map((e) => e.id)).toEqual(["b"]);
	});
});

describe("switchLeaf", () => {
	it("returns target id when entry exists", () => {
		const entries = [makeEntry("a", null), makeEntry("b", "a")];

		expect(switchLeaf(entries, "b")).toBe("b");
	});

	it("returns undefined when entry does not exist", () => {
		const entries = [makeEntry("a", null)];

		expect(switchLeaf(entries, "nonexistent")).toBeUndefined();
	});
});

describe("migrateLinearToTree", () => {
	it("links messages in a chain", () => {
		_resetIdCounterForTest();
		const messages: MessageWithMetadata[] = [
			{ id: "x1", role: "user", content: "hello" },
			{ id: "x2", role: "assistant", content: "hi" },
			{ id: "x3", role: "user", content: "bye" },
		];

		const result = migrateLinearToTree(messages);

		expect(result.entries).toHaveLength(3);
		expect(result.entries[0]?.parentId).toBeNull();
		expect(result.entries[1]?.parentId).toBe("x1");
		expect(result.entries[2]?.parentId).toBe("x2");
		expect(result.activeLeafId).toBe("x3");
	});

	it("generates IDs for messages without them", () => {
		_resetIdCounterForTest();
		const messages: MessageWithMetadata[] = [
			{ role: "user", content: "hello" },
			{ role: "assistant", content: "hi" },
		];

		const result = migrateLinearToTree(messages);

		expect(result.entries).toHaveLength(2);
		expect(result.entries[0]?.id).toBeTruthy();
		expect(result.entries[1]?.id).toBeTruthy();
		expect(result.entries[0]?.id).not.toBe(result.entries[1]?.id);
		expect(result.entries[1]?.parentId).toBe(result.entries[0]?.id);
	});

	it("returns empty for empty input", () => {
		const result = migrateLinearToTree([]);

		expect(result.entries).toEqual([]);
		expect(result.activeLeafId).toBeUndefined();
	});

	it("sets activeLeafId to last entry", () => {
		_resetIdCounterForTest();
		const messages: MessageWithMetadata[] = [
			{ id: "a", role: "user", content: "1" },
			{ id: "b", role: "assistant", content: "2" },
			{ id: "c", role: "user", content: "3" },
		];

		const result = migrateLinearToTree(messages);

		expect(result.activeLeafId).toBe("c");
	});
});

describe("validateSessionTree", () => {
	it("validates a healthy tree", () => {
		const entries = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
		];

		const result = validateSessionTree(entries);

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("detects duplicate IDs", () => {
		const entries = [makeEntry("a", null), makeEntry("a", null)];

		const result = validateSessionTree(entries);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Duplicate"))).toBe(true);
	});

	it("detects dangling parentId", () => {
		const entries = [makeEntry("a", null), makeEntry("b", "nonexistent")];

		const result = validateSessionTree(entries);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("dangling"))).toBe(true);
	});

	it("detects cycles", () => {
		const entries = [makeEntry("a", "b"), makeEntry("b", "a")];

		const result = validateSessionTree(entries);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Cycle"))).toBe(true);
	});

	it("detects missing IDs", () => {
		const entries = [
			{ role: "user", content: "x", parentId: null } as SessionTreeEntry,
		];

		const result = validateSessionTree(entries);

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("missing"))).toBe(true);
	});
});
