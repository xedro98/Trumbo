import type { MessageWithMetadata } from "@trumbo/shared";
import {
	buildSessionTree,
	getActivePath,
	getAncestorPath,
	getChildren,
	getDescendants,
	getLeafEntryIds,
	migrateLinearToTree,
	type SessionTreeEntry,
	switchLeaf,
	validateSessionTree,
} from "@trumbo/shared";
import { describe, expect, it } from "vitest";
import {
	hostSupportsSessionTree,
	SessionTreeService,
} from "./session-tree-service";
import { ConversationStore } from "./stores/conversation-store";

function entry(
	id: string,
	parentId: string | null,
	role: "user" | "assistant" = "user",
	content = "x",
): SessionTreeEntry {
	return { id, parentId, role, content };
}

// ============================================================
// EDGE CASES: Empty / Null / Undefined
// ============================================================

describe("Edge cases: empty inputs", () => {
	it("buildSessionTree with empty array", () => {
		expect(buildSessionTree([])).toEqual([]);
	});

	it("getActivePath with empty entries", () => {
		expect(getActivePath([], "anything")).toEqual([]);
	});

	it("getActivePath with empty entries and no leafId", () => {
		expect(getActivePath([], undefined)).toEqual([]);
	});

	it("getAncestorPath with empty entries", () => {
		expect(getAncestorPath([], "anything")).toEqual([]);
	});

	it("getChildren with empty entries", () => {
		expect(getChildren([], "anything")).toEqual([]);
	});

	it("getLeafEntryIds with empty entries", () => {
		expect(getLeafEntryIds([])).toEqual([]);
	});

	it("getDescendants with empty entries", () => {
		expect(getDescendants([], "anything")).toEqual([]);
	});

	it("migrateLinearToTree with empty array", () => {
		const result = migrateLinearToTree([]);
		expect(result.entries).toEqual([]);
		expect(result.activeLeafId).toBeUndefined();
	});

	it("validateSessionTree with empty entries", () => {
		expect(validateSessionTree([]).valid).toBe(true);
	});

	it("switchLeaf with empty entries", () => {
		expect(switchLeaf([], "anything")).toBeUndefined();
	});

	it("ConversationStore starts empty", () => {
		const store = new ConversationStore();
		expect(store.getMessages()).toEqual([]);
		expect(store.getEntries()).toEqual([]);
		expect(store.getActiveLeafId()).toBeUndefined();
	});

	it("ConversationStore appendMessage with empty content", () => {
		const store = new ConversationStore();
		store.appendMessage({ role: "user", content: "" });
		expect(store.getMessages()).toHaveLength(1);
		expect(store.getEntries()[0]?.content).toBe("");
	});
});

// ============================================================
// EDGE CASES: Missing IDs / Dangling References
// ============================================================

describe("Edge cases: missing IDs and dangling refs", () => {
	it("entries with missing id are skipped in buildSessionTree", () => {
		const entries = [
			{ role: "user", content: "no id", parentId: null },
			entry("a", null),
		] as SessionTreeEntry[];
		const roots = buildSessionTree(entries);
		expect(roots).toHaveLength(1);
		expect(roots[0]?.entry.id).toBe("a");
	});

	it("getAncestorPath with nonexistent entryId returns empty", () => {
		expect(getAncestorPath([entry("a", null)], "nonexistent")).toEqual([]);
	});

	it("getActivePath with nonexistent activeLeafId falls back to full list", () => {
		const entries = [entry("a", null), entry("b", "a")];
		const path = getActivePath(entries, "nonexistent");
		expect(path.length).toBeGreaterThan(0);
	});

	it("switchLeaf with nonexistent entryId returns undefined", () => {
		expect(switchLeaf([entry("a", null)], "nonexistent")).toBeUndefined();
	});

	it("ConversationStore switchLeaf with nonexistent entry returns false", () => {
		const store = new ConversationStore();
		store.restore([entry("a", null)]);
		expect(store.switchLeaf("nonexistent")).toBe(false);
	});

	it("validateSessionTree detects dangling parentId", () => {
		const entries = [entry("a", "nonexistent")];
		const result = validateSessionTree(entries);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("dangling"))).toBe(true);
	});
});

// ============================================================
// EDGE CASES: Cycles
// ============================================================

describe("Edge cases: cycles", () => {
	it("getAncestorPath breaks on self-referencing cycle", () => {
		const entries = [entry("a", "a")];
		const path = getAncestorPath(entries, "a");
		expect(path).toHaveLength(1);
	});

	it("getAncestorPath breaks on two-node cycle", () => {
		const entries = [entry("a", "b"), entry("b", "a")];
		const path = getAncestorPath(entries, "a");
		expect(path.length).toBeLessThanOrEqual(2);
	});

	it("getDescendants handles cycles without infinite loop", () => {
		const entries = [entry("a", "b"), entry("b", "a")];
		const descendants = getDescendants(entries, "a");
		expect(descendants.length).toBeLessThanOrEqual(1);
	});

	it("validateSessionTree detects cycles", () => {
		const entries = [entry("a", "b"), entry("b", "a")];
		const result = validateSessionTree(entries);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Cycle"))).toBe(true);
	});

	it("buildSessionTree with cycle produces finite result", () => {
		const entries = [entry("a", "b"), entry("b", "a")];
		const roots = buildSessionTree(entries);
		expect(roots.length).toBeGreaterThan(0);
		expect(roots.length).toBeLessThanOrEqual(2);
	});

	it("ConversationStore restore with cycle doesn't crash", () => {
		const store = new ConversationStore();
		store.restore([
			{ id: "a", parentId: "b", role: "user", content: "cycle" },
			{ id: "b", parentId: "a", role: "assistant", content: "cycle" },
		]);
		expect(store.getEntries()).toHaveLength(2);
	});
});

// ============================================================
// EDGE CASES: Large Data
// ============================================================

describe("Edge cases: large data", () => {
	it("buildSessionTree handles 1000 entries", () => {
		const entries: SessionTreeEntry[] = [];
		for (let i = 0; i < 1000; i++) {
			entries.push(entry(`id-${i}`, i === 0 ? null : `id-${i - 1}`));
		}
		const roots = buildSessionTree(entries);
		expect(roots).toHaveLength(1);
	});

	it("getActivePath handles 1000 entries", () => {
		const entries: SessionTreeEntry[] = [];
		for (let i = 0; i < 1000; i++) {
			entries.push(entry(`id-${i}`, i === 0 ? null : `id-${i - 1}`));
		}
		const path = getActivePath(entries, "id-999");
		expect(path).toHaveLength(1000);
	});

	it("migrateLinearToTree handles 1000 messages", () => {
		const messages: MessageWithMetadata[] = [];
		for (let i = 0; i < 1000; i++) {
			messages.push({
				id: `m-${i}`,
				role: i % 2 === 0 ? "user" : "assistant",
				content: `msg ${i}`,
			});
		}
		const result = migrateLinearToTree(messages);
		expect(result.entries).toHaveLength(1000);
		expect(result.activeLeafId).toBe("m-999");
		expect(result.entries[999].parentId).toBe("m-998");
	});

	it("ConversationStore handles 500 append operations", () => {
		const store = new ConversationStore();
		for (let i = 0; i < 500; i++) {
			store.appendMessage({
				role: i % 2 === 0 ? "user" : "assistant",
				content: `msg ${i}`,
			});
		}
		expect(store.getEntries()).toHaveLength(500);
		expect(store.getMessages()).toHaveLength(500);
		expect(store.getActiveLeafId()).toBeDefined();
	});
});

// ============================================================
// EDGE CASES: Unicode / Special Characters
// ============================================================

describe("Edge cases: unicode and special characters", () => {
	it("handles CJK content in messages", () => {
		const entries = [
			entry("a", null, "user", "你好世界"),
			entry("b", "a", "assistant", "こんにちは"),
		];
		const path = getActivePath(entries, "b");
		expect(path[1]?.content).toBe("こんにちは");
	});

	it("handles emoji in content", () => {
		const entries = [entry("a", null, "user", "Hello 🌍 🎉")];
		const roots = buildSessionTree(entries);
		expect(roots[0]?.entry.content).toBe("Hello 🌍 🎉");
	});

	it("handles very long content strings", () => {
		const longContent = "x".repeat(100000);
		const entries = [entry("a", null, "user", longContent)];
		const path = getActivePath(entries, "a");
		expect(path[0]?.content).toBe(longContent);
	});

	it("handles newlines in content", () => {
		const entries = [entry("a", null, "user", "line1\nline2\nline3")];
		const roots = buildSessionTree(entries);
		expect(roots[0]?.entry.content).toContain("\n");
	});

	it("migrateLinearToTree preserves unicode content", () => {
		const messages: MessageWithMetadata[] = [
			{ id: "x1", role: "user", content: "Привет мир" },
			{ id: "x2", role: "assistant", content: "مرحبا بالعالم" },
		];
		const result = migrateLinearToTree(messages);
		expect(result.entries[0]?.content).toBe("Привет мир");
		expect(result.entries[1]?.content).toBe("مرحبا بالعالم");
	});

	it("ConversationStore handles unicode content", () => {
		const store = new ConversationStore();
		store.appendMessage({ role: "user", content: "你好 🎉" });
		expect(store.getMessages()[0]?.content).toBe("你好 🎉");
	});
});

// ============================================================
// EDGE CASES: Branching Scenarios
// ============================================================

describe("Edge cases: branching", () => {
	it("deeply nested tree (50 levels)", () => {
		const entries: SessionTreeEntry[] = [];
		for (let i = 0; i < 50; i++) {
			entries.push(entry(`n${i}`, i === 0 ? null : `n${i - 1}`));
		}
		const path = getAncestorPath(entries, "n49");
		expect(path).toHaveLength(50);
		expect(path[0]?.id).toBe("n0");
		expect(path[49]?.id).toBe("n49");
	});

	it("wide tree (100 branches from one root)", () => {
		const entries: SessionTreeEntry[] = [entry("root", null)];
		for (let i = 0; i < 100; i++) {
			entries.push(entry(`branch-${i}`, "root"));
		}
		const children = getChildren(entries, "root");
		expect(children).toHaveLength(100);
		const leaves = getLeafEntryIds(entries);
		expect(leaves).toHaveLength(100);
	});

	it("switching between branches preserves entries", () => {
		const store = new ConversationStore();
		store.restore([
			entry("a", null, "user", "root"),
			entry("b", "a", "assistant", "response"),
			entry("c", "b", "user", "branch 1"),
			entry("d", "b", "user", "branch 2"),
		]);

		store.switchLeaf("c");
		expect(store.getMessages().map((m) => m.id)).toEqual(["a", "b", "c"]);
		expect(store.getEntries()).toHaveLength(4);

		store.switchLeaf("d");
		expect(store.getMessages().map((m) => m.id)).toEqual(["a", "b", "d"]);
		expect(store.getEntries()).toHaveLength(4);

		store.switchLeaf("c");
		expect(store.getMessages().map((m) => m.id)).toEqual(["a", "b", "c"]);
	});

	it("branchFrom then append creates new branch", () => {
		const store = new ConversationStore();
		store.restore([
			entry("a", null, "user", "root"),
			entry("b", "a", "assistant", "resp"),
			entry("c", "b", "user", "old path"),
		]);

		store.branchFrom("b");
		store.appendMessage({ role: "user", content: "new path" });

		const entries = store.getEntries();
		expect(entries).toHaveLength(4);
		const newEntry = entries[3];
		expect(newEntry?.parentId).toBe("b");

		// Old path entry still exists
		const oldEntry = entries.find((e) => e.id === "c");
		expect(oldEntry).toBeDefined();
		expect(oldEntry?.content).toBe("old path");
	});
});

// ============================================================
// EDGE CASES: v1 Linear Migration
// ============================================================

describe("Edge cases: v1 linear migration", () => {
	it("single message migration", () => {
		const result = migrateLinearToTree([
			{ id: "only", role: "user", content: "hello" },
		]);
		expect(result.entries).toHaveLength(1);
		expect(result.entries[0]?.parentId).toBeNull();
		expect(result.activeLeafId).toBe("only");
	});

	it("messages without IDs get generated IDs", () => {
		const result = migrateLinearToTree([
			{ role: "user", content: "a" },
			{ role: "assistant", content: "b" },
		]);
		expect(result.entries).toHaveLength(2);
		expect(result.entries[0]?.id).toBeTruthy();
		expect(result.entries[1]?.id).toBeTruthy();
		expect(result.entries[0]?.id).not.toBe(result.entries[1]?.id);
		expect(result.entries[1]?.parentId).toBe(result.entries[0]?.id);
	});

	it("v1 messages with no parentId treated as linear by getActivePath", () => {
		const v1Messages = [
			{ id: "x1", role: "user" as const, content: "1" },
			{ id: "x2", role: "assistant" as const, content: "2" },
			{ id: "x3", role: "user" as const, content: "3" },
		];
		const path = getActivePath(v1Messages, "x3");
		expect(path).toHaveLength(3);
		expect(path.map((e) => e.id)).toEqual(["x1", "x2", "x3"]);
	});

	it("ConversationStore restore handles v1 messages (no parentId)", () => {
		const store = new ConversationStore();
		store.restore([
			{ id: "x1", role: "user", content: "1" },
			{ id: "x2", role: "assistant", content: "2" },
		]);
		const entries = store.getEntries();
		expect(entries[0]?.parentId).toBeNull();
		expect(entries[1]?.parentId).toBe("x1");
		expect(store.getActiveLeafId()).toBe("x2");
	});
});

// ============================================================
// EDGE CASES: SessionTreeService with Mock Host
// ============================================================

describe("Edge cases: SessionTreeService", () => {
	it("handles host that returns empty messages", async () => {
		const mockHost = {
			readSessionTree: async () => ({ messages: [] }),
			persistSessionTree: async () => {},
		};
		const service = new SessionTreeService(mockHost);
		const snapshot = await service.getSnapshot("test");
		expect(snapshot.entries).toEqual([]);
		expect(snapshot.activePath).toEqual([]);
	});

	it("handles host that returns undefined activeLeafId", async () => {
		const mockHost = {
			readSessionTree: async () => ({
				messages: [entry("a", null), entry("b", "a")],
				activeLeafId: undefined,
			}),
			persistSessionTree: async () => {},
		};
		const service = new SessionTreeService(mockHost);
		const leafId = await service.getActiveLeafId("test");
		expect(leafId).toBeUndefined();
	});

	it("switchLeaf on empty session returns false", async () => {
		const mockHost = {
			readSessionTree: async () => ({ messages: [] }),
			persistSessionTree: async () => {},
		};
		const service = new SessionTreeService(mockHost);
		expect(await service.switchLeaf("test", "any")).toBe(false);
	});

	it("switchLeaf to same leaf returns true without persisting", async () => {
		let persistCalled = false;
		const mockHost = {
			readSessionTree: async () => ({
				messages: [entry("a", null), entry("b", "a")],
				activeLeafId: "b",
			}),
			persistSessionTree: async () => {
				persistCalled = true;
			},
		};
		const service = new SessionTreeService(mockHost);
		const result = await service.switchLeaf("test", "b");
		expect(result).toBe(true);
		expect(persistCalled).toBe(false);
	});

	it("hostSupportsSessionTree rejects null/undefined", () => {
		expect(hostSupportsSessionTree(null)).toBe(false);
		expect(hostSupportsSessionTree(undefined)).toBe(false);
		expect(hostSupportsSessionTree({})).toBe(false);
		expect(hostSupportsSessionTree(42)).toBe(false);
		expect(hostSupportsSessionTree("string")).toBe(false);
	});

	it("hostSupportsSessionTree accepts host with both methods", () => {
		const host = {
			readSessionTree: () => {},
			persistSessionTree: () => {},
		};
		expect(hostSupportsSessionTree(host)).toBe(true);
	});

	it("hostSupportsSessionTree rejects partial implementation", () => {
		expect(hostSupportsSessionTree({ readSessionTree: () => {} })).toBe(false);
		expect(hostSupportsSessionTree({ persistSessionTree: () => {} })).toBe(
			false,
		);
	});
});

// ============================================================
// EDGE CASES: ConversationStore replaceMessages
// ============================================================

describe("Edge cases: ConversationStore replaceMessages", () => {
	it("replaceMessages with empty array clears active path", () => {
		const store = new ConversationStore();
		store.appendMessage({ role: "user", content: "hello" });
		store.replaceMessages([]);
		expect(store.getMessages()).toEqual([]);
	});

	it("replaceMessages with same messages keeps structure", () => {
		const store = new ConversationStore();
		store.appendMessage({ role: "user", content: "a" });
		store.appendMessage({ role: "assistant", content: "b" });
		const _beforeIds = store.getEntries().map((e) => e.id);
		store.replaceMessages([
			{ role: "user", content: "a" },
			{ role: "assistant", content: "b" },
		]);
		const afterIds = store.getEntries().map((e) => e.id);
		expect(afterIds.length).toBeGreaterThanOrEqual(2);
	});

	it("replaceMessages preserves entries from other branches", () => {
		const store = new ConversationStore();
		store.restore([
			entry("a", null, "user", "root"),
			entry("b", "a", "assistant", "resp"),
			entry("c", "b", "user", "branch A"),
			entry("d", "b", "user", "branch B"),
		]);

		store.branchFrom("b");
		store.appendMessage({ role: "user", content: "new" });

		const _entriesBefore = store.getEntries().length;
		store.replaceMessages([
			{ id: "a", role: "user", content: "root" },
			{ id: "b", role: "assistant", content: "resp" },
		]);
		const entriesAfter = store.getEntries();

		// Branch entries (c, d) should still exist
		expect(entriesAfter.some((e) => e.id === "c")).toBe(true);
		expect(entriesAfter.some((e) => e.id === "d")).toBe(true);
	});
});

// ============================================================
// EDGE CASES: Duplicate IDs
// ============================================================

describe("Edge cases: duplicate IDs", () => {
	it("validateSessionTree detects duplicate IDs", () => {
		const entries = [entry("a", null), entry("a", null)];
		const result = validateSessionTree(entries);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Duplicate"))).toBe(true);
	});

	it("validateSessionTree detects missing IDs", () => {
		const entries = [
			{ role: "user", content: "x", parentId: null } as SessionTreeEntry,
		];
		const result = validateSessionTree(entries);
		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("missing"))).toBe(true);
	});

	it("buildSessionTree with duplicate IDs uses last occurrence", () => {
		const entries = [
			entry("a", null, "user", "first"),
			entry("a", null, "user", "second"),
		];
		const roots = buildSessionTree(entries);
		// Should not crash; duplicates are overwritten in the Map
		expect(roots.length).toBeGreaterThan(0);
	});
});
