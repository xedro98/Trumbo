import { mkdirSync, writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type * as LlmsProviders from "@trumbodev/llms";
import type { MessageWithMetadata, SessionTreeEntry } from "@trumbodev/shared";
import { afterEach, describe, expect, it } from "vitest";
import { buildMessagesFilePayload } from "../services/session-data";
import {
	hostSupportsSessionTree,
	SessionTreeService,
} from "./session-tree-service";

const tempDirs: string[] = [];

afterEach(async () => {
	await Promise.allSettled(
		tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
	);
});

async function makeTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "session-tree-service-"));
	tempDirs.push(dir);
	return dir;
}

function writeMessagesFile(
	dir: string,
	messages: MessageWithMetadata[],
	activeLeafId?: string,
): string {
	const path = join(dir, "test.messages.json");
	mkdirSync(dirname(path), { recursive: true });
	const payload = buildMessagesFilePayload({
		updatedAt: new Date().toISOString(),
		context: { agent: "lead", sessionId: "test" },
		messages,
		activeLeafId,
	});
	writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
	return path;
}

function makeEntry(
	id: string,
	parentId: string | null,
	role: "user" | "assistant" = "user",
	content = "test",
): MessageWithMetadata {
	return { id, parentId, role, content };
}

/**
 * In-memory mock host for unit testing the SessionTreeService
 * without touching the filesystem.
 */
class MockTreeHost {
	private messagesBySession = new Map<
		string,
		{ messages: MessageWithMetadata[]; activeLeafId?: string }
	>();

	constructor(messages: MessageWithMetadata[], activeLeafId?: string) {
		this.messagesBySession.set("test", { messages, activeLeafId });
	}

	async readSessionTree(sessionId: string): Promise<{
		messages: LlmsProviders.Message[];
		activeLeafId?: string;
	}> {
		const data = this.messagesBySession.get(sessionId);
		if (!data) return { messages: [] };
		return {
			messages: data.messages as LlmsProviders.Message[],
			activeLeafId: data.activeLeafId,
		};
	}

	async persistSessionTree(
		sessionId: string,
		messages: LlmsProviders.Message[],
		activeLeafId?: string,
	): Promise<void> {
		this.messagesBySession.set(sessionId, {
			messages: messages as MessageWithMetadata[],
			activeLeafId,
		});
	}

	getStored(sessionId: string) {
		return this.messagesBySession.get(sessionId);
	}
}

describe("hostSupportsSessionTree", () => {
	it("returns true for a host with readSessionTree and persistSessionTree", () => {
		const host = new MockTreeHost([]);
		expect(hostSupportsSessionTree(host)).toBe(true);
	});

	it("returns false for a host without tree methods", () => {
		expect(hostSupportsSessionTree({})).toBe(false);
		expect(hostSupportsSessionTree({ readSessionTree: () => {} })).toBe(false);
		expect(hostSupportsSessionTree(null)).toBe(false);
		expect(hostSupportsSessionTree(undefined)).toBe(false);
		expect(hostSupportsSessionTree(42)).toBe(false);
		expect(hostSupportsSessionTree("string")).toBe(false);
	});
});

describe("SessionTreeService — read operations", () => {
	const entries: SessionTreeEntry[] = [
		makeEntry("a", null, "user", "hello"),
		makeEntry("b", "a", "assistant", "hi there"),
		makeEntry("c", "b", "user", "do thing X"),
		makeEntry("d", "b", "user", "instead do Y"),
	];

	it("getSnapshot returns entries, activeLeafId, and activePath", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const snapshot = await service.getSnapshot("test");

		expect(snapshot.sessionId).toBe("test");
		expect(snapshot.entries).toHaveLength(4);
		expect(snapshot.activeLeafId).toBe("d");
		expect(snapshot.activePath.map((e) => e.id)).toEqual(["a", "b", "d"]);
	});

	it("getSnapshot falls back to last entry when no activeLeafId", async () => {
		const host = new MockTreeHost(entries);
		const service = new SessionTreeService(host);

		const snapshot = await service.getSnapshot("test");

		expect(snapshot.activeLeafId).toBeUndefined();
		// Without activeLeafId, falls back to last entry "d".
		// Active path is root-to-d: a -> b -> d (not the full array, since
		// "c" is on a different branch).
		expect(snapshot.activePath.map((e) => e.id)).toEqual(["a", "b", "d"]);
	});

	it("getSnapshot handles empty session", async () => {
		const host = new MockTreeHost([]);
		const service = new SessionTreeService(host);

		const snapshot = await service.getSnapshot("test");

		expect(snapshot.entries).toEqual([]);
		expect(snapshot.activePath).toEqual([]);
		expect(snapshot.activeLeafId).toBeUndefined();
	});

	it("getTree returns tree structure", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const tree = await service.getTree("test");

		expect(tree).toHaveLength(1);
		expect(tree[0]?.entry.id).toBe("a");
		expect(tree[0]?.children).toHaveLength(1);
		expect(tree[0]?.children[0]?.entry.id).toBe("b");
		expect(tree[0]?.children[0]?.children).toHaveLength(2);
	});

	it("getEntries returns all entries", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const result = await service.getEntries("test");

		expect(result).toHaveLength(4);
		expect(result.map((e) => e.id)).toEqual(["a", "b", "c", "d"]);
	});

	it("getActivePath returns root-to-leaf path", async () => {
		const host = new MockTreeHost(entries, "c");
		const service = new SessionTreeService(host);

		const path = await service.getActivePath("test");

		expect(path.map((e) => e.id)).toEqual(["a", "b", "c"]);
	});

	it("getActiveLeafId returns the active leaf", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		expect(await service.getActiveLeafId("test")).toBe("d");
	});

	it("getActiveLeafId returns undefined when not set", async () => {
		const host = new MockTreeHost(entries);
		const service = new SessionTreeService(host);

		expect(await service.getActiveLeafId("test")).toBeUndefined();
	});

	it("getLeafEntryIds returns all branch tips", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const leaves = await service.getLeafEntryIds("test");

		expect(leaves.sort()).toEqual(["c", "d"]);
	});

	it("getChildren returns direct children", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const children = await service.getChildren("test", "b");

		expect(children.map((e) => e.id).sort()).toEqual(["c", "d"]);
	});

	it("getChildren returns empty for leaf", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		expect(await service.getChildren("test", "d")).toEqual([]);
	});

	it("getDescendants returns all descendants recursively", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const descendants = await service.getDescendants("test", "a");

		expect(descendants.map((e) => e.id).sort()).toEqual(["b", "c", "d"]);
	});

	it("getAncestorPath returns root-to-entry path", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const path = await service.getAncestorPath("test", "d");

		expect(path.map((e) => e.id)).toEqual(["a", "b", "d"]);
	});

	it("getAncestorPath returns empty for nonexistent entry", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		expect(await service.getAncestorPath("test", "nonexistent")).toEqual([]);
	});
});

describe("SessionTreeService — switchLeaf", () => {
	const entries: SessionTreeEntry[] = [
		makeEntry("a", null, "user", "hello"),
		makeEntry("b", "a", "assistant", "hi"),
		makeEntry("c", "b", "user", "path 1"),
		makeEntry("d", "b", "user", "path 2"),
	];

	it("switches to a valid entry and persists with a branch summary", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const result = await service.switchLeaf("test", "c");

		expect(result).toBe(true);
		const stored = host.getStored("test");
		expect(stored).toBeDefined();
		// A branchSummary entry is injected after the switch; the active leaf
		// becomes the summary entry, not the target entry itself.
		const storedMessages = stored?.messages as SessionTreeEntry[];
		const summary = storedMessages?.find(
			(e) => e.entryKind === "branchSummary",
		);
		expect(summary).toBeDefined();
		expect(summary?.parentId).toBe("c");
		expect(stored?.activeLeafId).toBe(summary?.id);
	});

	it("returns false for nonexistent entry", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		const result = await service.switchLeaf("test", "nonexistent");

		expect(result).toBe(false);
		expect(host.getStored("test")?.activeLeafId).toBe("d");
	});

	it("returns true and does not persist when switching to same leaf", async () => {
		const host = new MockTreeHost(entries, "c");
		const service = new SessionTreeService(host);

		const result = await service.switchLeaf("test", "c");

		expect(result).toBe(true);
		expect(host.getStored("test")?.activeLeafId).toBe("c");
	});

	it("returns false for empty session", async () => {
		const host = new MockTreeHost([]);
		const service = new SessionTreeService(host);

		const result = await service.switchLeaf("test", "a");

		expect(result).toBe(false);
	});

	it("switching leaf changes the active path and includes the branch summary", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		await service.switchLeaf("test", "c");
		const path = await service.getActivePath("test");

		// The path includes the original entries up to "c" plus the injected
		// branchSummary entry.
		expect(path.map((e) => e.id)).toContain("a");
		expect(path.map((e) => e.id)).toContain("b");
		expect(path.map((e) => e.id)).toContain("c");
		expect(path.find((e) => e.entryKind === "branchSummary")).toBeDefined();
	});

	it("preserves all original entries and adds a branch summary when switching leaf", async () => {
		const host = new MockTreeHost(entries, "d");
		const service = new SessionTreeService(host);

		await service.switchLeaf("test", "c");
		const allEntries = await service.getEntries("test");

		// 4 original entries + 1 injected branchSummary = 5
		expect(allEntries).toHaveLength(5);
		expect(allEntries.map((e) => e.id).sort()).toEqual(
			expect.arrayContaining(["a", "b", "c", "d"]),
		);
		expect(
			allEntries.find((e) => e.entryKind === "branchSummary"),
		).toBeDefined();
	});
});

describe("SessionTreeService — branchFrom", () => {
	const entries: SessionTreeEntry[] = [
		makeEntry("a", null, "user", "hello"),
		makeEntry("b", "a", "assistant", "hi"),
		makeEntry("c", "b", "user", "old path"),
	];

	it("branchFrom is an alias for switchLeaf (injects branch summary)", async () => {
		const host = new MockTreeHost(entries, "c");
		const service = new SessionTreeService(host);

		const result = await service.branchFrom("test", "b");

		expect(result).toBe(true);
		const stored = host.getStored("test");
		const storedMessages = stored?.messages as SessionTreeEntry[];
		const summary = storedMessages?.find(
			(e) => e.entryKind === "branchSummary",
		);
		expect(summary).toBeDefined();
		expect(summary?.parentId).toBe("b");
		expect(stored?.activeLeafId).toBe(summary?.id);
	});

	it("branchFrom returns false for nonexistent entry", async () => {
		const host = new MockTreeHost(entries, "c");
		const service = new SessionTreeService(host);

		const result = await service.branchFrom("test", "nonexistent");

		expect(result).toBe(false);
	});
});

describe("SessionTreeService — validateTree", () => {
	it("validates a healthy tree", async () => {
		const entries: SessionTreeEntry[] = [
			makeEntry("a", null),
			makeEntry("b", "a"),
			makeEntry("c", "b"),
		];
		const host = new MockTreeHost(entries, "c");
		const service = new SessionTreeService(host);

		const result = await service.validateTree("test");

		expect(result.valid).toBe(true);
		expect(result.errors).toEqual([]);
	});

	it("detects duplicate IDs", async () => {
		const entries: SessionTreeEntry[] = [
			makeEntry("a", null),
			makeEntry("a", null),
		];
		const host = new MockTreeHost(entries, "a");
		const service = new SessionTreeService(host);

		const result = await service.validateTree("test");

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Duplicate"))).toBe(true);
	});

	it("detects dangling parentId", async () => {
		const entries: SessionTreeEntry[] = [
			makeEntry("a", null),
			makeEntry("b", "nonexistent"),
		];
		const host = new MockTreeHost(entries, "b");
		const service = new SessionTreeService(host);

		const result = await service.validateTree("test");

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("dangling"))).toBe(true);
	});

	it("detects cycles", async () => {
		const entries: SessionTreeEntry[] = [
			makeEntry("a", "b"),
			makeEntry("b", "a"),
		];
		const host = new MockTreeHost(entries, "a");
		const service = new SessionTreeService(host);

		const result = await service.validateTree("test");

		expect(result.valid).toBe(false);
		expect(result.errors.some((e) => e.includes("Cycle"))).toBe(true);
	});
});

describe("SessionTreeService — edge cases", () => {
	it("handles session with single root entry", async () => {
		const host = new MockTreeHost([makeEntry("a", null, "user", "hello")], "a");
		const service = new SessionTreeService(host);

		const snapshot = await service.getSnapshot("test");
		expect(snapshot.entries).toHaveLength(1);
		expect(snapshot.activePath).toHaveLength(1);
		expect(snapshot.activeLeafId).toBe("a");

		const leaves = await service.getLeafEntryIds("test");
		expect(leaves).toEqual(["a"]);
	});

	it("handles v1 linear session (no parentId)", async () => {
		const v1Messages: MessageWithMetadata[] = [
			{ id: "x1", role: "user", content: "1" },
			{ id: "x2", role: "assistant", content: "2" },
			{ id: "x3", role: "user", content: "3" },
		];
		const host = new MockTreeHost(v1Messages, "x3");
		const service = new SessionTreeService(host);

		const path = await service.getActivePath("test");
		expect(path).toHaveLength(3);
		expect(path.map((e) => e.id)).toEqual(["x1", "x2", "x3"]);
	});

	it("handles session with multiple roots", async () => {
		const entries: SessionTreeEntry[] = [
			makeEntry("a", null, "user", "root 1"),
			makeEntry("b", null, "user", "root 2"),
		];
		const host = new MockTreeHost(entries, "b");
		const service = new SessionTreeService(host);

		const tree = await service.getTree("test");
		expect(tree).toHaveLength(2);
	});

	it("handles nonexistent session gracefully", async () => {
		const host = new MockTreeHost([], undefined);
		const service = new SessionTreeService(host);

		const snapshot = await service.getSnapshot("nonexistent");
		expect(snapshot.entries).toEqual([]);
		expect(snapshot.activePath).toEqual([]);
	});

	it("getChildren for nonexistent parent returns empty", async () => {
		const host = new MockTreeHost([makeEntry("a", null)], "a");
		const service = new SessionTreeService(host);

		expect(await service.getChildren("test", "nonexistent")).toEqual([]);
	});

	it("getDescendants for leaf returns empty", async () => {
		const entries: SessionTreeEntry[] = [
			makeEntry("a", null),
			makeEntry("b", "a"),
		];
		const host = new MockTreeHost(entries, "b");
		const service = new SessionTreeService(host);

		expect(await service.getDescendants("test", "b")).toEqual([]);
	});
});

describe("SessionTreeService — filesystem integration", () => {
	it("reads a v2 messages file from disk", async () => {
		const dir = await makeTempDir();
		const messages: MessageWithMetadata[] = [
			makeEntry("a", null, "user", "hello"),
			makeEntry("b", "a", "assistant", "hi"),
			makeEntry("c", "b", "user", "branch A"),
			makeEntry("d", "b", "user", "branch B"),
		];
		const path = writeMessagesFile(dir, messages, "d");

		const { readSessionTreeFile } = await import(
			"../runtime/host/runtime-host-support"
		);
		const result = await readSessionTreeFile(path);

		expect(result.messages).toHaveLength(4);
		expect(result.activeLeafId).toBe("d");
	});

	it("reads a v1 messages file (no active_leaf_id)", async () => {
		const dir = await makeTempDir();
		const path = join(dir, "v1.messages.json");
		writeFileSync(
			path,
			`${JSON.stringify(
				{
					version: 1,
					updated_at: new Date().toISOString(),
					agent: "lead",
					sessionId: "test",
					messages: [
						{ id: "x1", role: "user", content: "1" },
						{ id: "x2", role: "assistant", content: "2" },
					],
				},
				null,
				2,
			)}\n`,
			"utf8",
		);

		const { readSessionTreeFile } = await import(
			"../runtime/host/runtime-host-support"
		);
		const result = await readSessionTreeFile(path);

		expect(result.messages).toHaveLength(2);
		expect(result.activeLeafId).toBeUndefined();
	});

	it("reads a bare array messages file (legacy)", async () => {
		const dir = await makeTempDir();
		const path = join(dir, "legacy.messages.json");
		writeFileSync(
			path,
			`${JSON.stringify([
				{ id: "x1", role: "user", content: "1" },
				{ id: "x2", role: "assistant", content: "2" },
			])}\n`,
			"utf8",
		);

		const { readSessionTreeFile } = await import(
			"../runtime/host/runtime-host-support"
		);
		const result = await readSessionTreeFile(path);

		expect(result.messages).toHaveLength(2);
		expect(result.activeLeafId).toBeUndefined();
	});

	it("handles missing file gracefully", async () => {
		const { readSessionTreeFile } = await import(
			"../runtime/host/runtime-host-support"
		);
		const result = await readSessionTreeFile("/nonexistent/path.json");
		expect(result.messages).toEqual([]);
	});

	it("handles corrupt file gracefully", async () => {
		const dir = await makeTempDir();
		const path = join(dir, "corrupt.messages.json");
		writeFileSync(path, "{ invalid json ]}", "utf8");

		const { readSessionTreeFile } = await import(
			"../runtime/host/runtime-host-support"
		);
		const result = await readSessionTreeFile(path);
		expect(result.messages).toEqual([]);
	});
});
