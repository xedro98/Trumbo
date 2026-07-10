import type { MessageWithMetadata } from "@trumbo/shared";
import { describe, expect, it } from "vitest";
import {
	buildTreePickerItems,
	extractText,
	hasToolContent,
} from "./tree-picker-utils";

function makeMessage(
	id: string,
	parentId: string | null,
	role: "user" | "assistant",
	content: string | MessageWithMetadata["content"],
): MessageWithMetadata {
	return { id, parentId, role, content } as MessageWithMetadata;
}

describe("extractText", () => {
	it("extracts from string content", () => {
		const msg = makeMessage("a", null, "user", "hello world");
		expect(extractText(msg)).toBe("hello world");
	});

	it("extracts from text block", () => {
		const msg = makeMessage("a", null, "assistant", [
			{ type: "text", text: "hello" },
		]);
		expect(extractText(msg)).toBe("hello");
	});

	it("extracts tool use names", () => {
		const msg = makeMessage("a", null, "assistant", [
			{ type: "text", text: "Running" },
			{ type: "tool_use", id: "t1", name: "read_files", input: {} },
		]);
		expect(extractText(msg)).toBe("Running [read_files]");
	});

	it("extracts tool results", () => {
		const msg = makeMessage("a", null, "user", [
			{
				type: "tool_result",
				tool_use_id: "t1",
				name: "read_files",
				content: "file contents",
			},
		]);
		expect(extractText(msg)).toBe("[result: read_files]");
	});

	it("extracts thinking blocks", () => {
		const msg = makeMessage("a", null, "assistant", [
			{ type: "thinking", thinking: "hmm" },
		]);
		expect(extractText(msg)).toBe("[thinking]");
	});

	it("returns (empty) for empty content array", () => {
		const msg = makeMessage("a", null, "assistant", []);
		expect(extractText(msg)).toBe("(empty)");
	});
});

describe("hasToolContent", () => {
	it("returns false for string content", () => {
		const msg = makeMessage("a", null, "user", "hello");
		expect(hasToolContent(msg)).toBe(false);
	});

	it("returns true for tool_use blocks", () => {
		const msg = makeMessage("a", null, "assistant", [
			{ type: "tool_use", id: "t1", name: "bash", input: {} },
		]);
		expect(hasToolContent(msg)).toBe(true);
	});

	it("returns true for tool_result blocks", () => {
		const msg = makeMessage("a", null, "user", [
			{
				type: "tool_result",
				tool_use_id: "t1",
				name: "bash",
				content: "output",
			},
		]);
		expect(hasToolContent(msg)).toBe(true);
	});

	it("returns false for text-only blocks", () => {
		const msg = makeMessage("a", null, "assistant", [
			{ type: "text", text: "hello" },
		]);
		expect(hasToolContent(msg)).toBe(false);
	});
});

describe("buildTreePickerItems", () => {
	it("builds a linear tree (linked list)", () => {
		const entries = [
			makeMessage("a", null, "user", "hello"),
			makeMessage("b", "a", "assistant", "hi"),
			makeMessage("c", "b", "user", "bye"),
		];

		const items = buildTreePickerItems(entries, "c");

		expect(items).toHaveLength(3);
		expect(items[0]?.depth).toBe(0);
		expect(items[1]?.depth).toBe(1);
		expect(items[2]?.depth).toBe(2);
		expect(items[2]?.isActiveLeaf).toBe(true);
		expect(items[0]?.isActiveLeaf).toBe(false);
	});

	it("builds a branching tree with correct depths", () => {
		const entries = [
			makeMessage("a", null, "user", "root"),
			makeMessage("b", "a", "assistant", "response"),
			makeMessage("c", "b", "user", "branch A"),
			makeMessage("d", "b", "user", "branch B"),
		];

		const items = buildTreePickerItems(entries, "d");

		expect(items).toHaveLength(4);
		expect(items[0]?.id).toBe("a");
		expect(items[0]?.depth).toBe(0);
		expect(items[1]?.id).toBe("b");
		expect(items[1]?.depth).toBe(1);
		expect(items[2]?.id).toBe("c");
		expect(items[2]?.depth).toBe(2);
		expect(items[3]?.id).toBe("d");
		expect(items[3]?.depth).toBe(2);
	});

	it("marks active path correctly", () => {
		const entries = [
			makeMessage("a", null, "user", "root"),
			makeMessage("b", "a", "assistant", "response"),
			makeMessage("c", "b", "user", "branch A"),
			makeMessage("d", "b", "user", "branch B"),
		];

		const items = buildTreePickerItems(entries, "d");

		expect(items[0]?.isOnActivePath).toBe(true); // a is ancestor of d
		expect(items[1]?.isOnActivePath).toBe(true); // b is ancestor of d
		expect(items[2]?.isOnActivePath).toBe(false); // c is NOT on path to d
		expect(items[3]?.isOnActivePath).toBe(true); // d is the active leaf
	});

	it("marks active leaf correctly", () => {
		const entries = [
			makeMessage("a", null, "user", "root"),
			makeMessage("b", "a", "assistant", "response"),
		];

		const items = buildTreePickerItems(entries, "b");
		expect(items[1]?.isActiveLeaf).toBe(true);
		expect(items[0]?.isActiveLeaf).toBe(false);
	});

	it("marks branch points correctly", () => {
		const entries = [
			makeMessage("a", null, "user", "root"),
			makeMessage("b", "a", "assistant", "branch point"),
			makeMessage("c", "b", "user", "child 1"),
			makeMessage("d", "b", "user", "child 2"),
		];

		const items = buildTreePickerItems(entries, "d");

		const branchPoint = items.find((i) => i.id === "b");
		expect(branchPoint?.hasChildren).toBe(true);
		expect(branchPoint?.isBranch).toBe(true);
	});

	it("marks non-branch parents correctly", () => {
		const entries = [
			makeMessage("a", null, "user", "root"),
			makeMessage("b", "a", "assistant", "single child"),
		];

		const items = buildTreePickerItems(entries, "b");

		const parent = items.find((i) => i.id === "a");
		expect(parent?.hasChildren).toBe(true);
		expect(parent?.isBranch).toBe(false);
	});

	it("handles empty entries", () => {
		expect(buildTreePickerItems([], undefined)).toEqual([]);
	});

	it("handles entries without activeLeafId", () => {
		const entries = [
			makeMessage("a", null, "user", "root"),
			makeMessage("b", "a", "assistant", "response"),
		];

		const items = buildTreePickerItems(entries, undefined);

		expect(items.every((i) => i.isActiveLeaf === false)).toBe(true);
		expect(items.every((i) => i.isOnActivePath === false)).toBe(true);
	});

	it("handles v1 linear messages (no parentId)", () => {
		const entries = [
			{ id: "x1", role: "user", content: "1" } as MessageWithMetadata,
			{ id: "x2", role: "assistant", content: "2" } as MessageWithMetadata,
			{ id: "x3", role: "user", content: "3" } as MessageWithMetadata,
		];

		const items = buildTreePickerItems(entries, "x3");

		expect(items).toHaveLength(3);
		expect(items[0]?.parentId).toBeNull();
		expect(items[1]?.parentId).toBeNull();
		expect(items[2]?.parentId).toBeNull();
		expect(items.every((i) => i.depth === 0)).toBe(true);
	});

	it("handles multiple roots", () => {
		const entries = [
			makeMessage("a", null, "user", "root 1"),
			makeMessage("b", null, "user", "root 2"),
		];

		const items = buildTreePickerItems(entries, "b");

		expect(items).toHaveLength(2);
		expect(items[0]?.depth).toBe(0);
		expect(items[1]?.depth).toBe(0);
	});

	it("handles deep nesting", () => {
		const entries = [
			makeMessage("a", null, "user", "0"),
			makeMessage("b", "a", "assistant", "1"),
			makeMessage("c", "b", "user", "2"),
			makeMessage("d", "c", "assistant", "3"),
			makeMessage("e", "d", "user", "4"),
		];

		const items = buildTreePickerItems(entries, "e");

		expect(items.map((i) => i.depth)).toEqual([0, 1, 2, 3, 4]);
	});

	it("handles cycles gracefully", () => {
		const entries = [
			makeMessage("a", "b", "user", "cycle a"),
			makeMessage("b", "a", "assistant", "cycle b"),
		];

		const items = buildTreePickerItems(entries, "a");

		expect(items.length).toBeGreaterThan(0);
		expect(items.length).toBeLessThanOrEqual(2);
	});
});
