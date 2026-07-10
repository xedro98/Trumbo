import type { MessageWithMetadata } from "@trumbo/shared";
import { describe, expect, it } from "vitest";
import { ConversationStore } from "./conversation-store";

function makeMessage(
	role: "user" | "assistant",
	content: string,
	id?: string,
): MessageWithMetadata {
	return { id, role, content };
}

describe("ConversationStore — linear mode (backward compat)", () => {
	it("starts empty", () => {
		const store = new ConversationStore();
		expect(store.getMessages()).toEqual([]);
		expect(store.getActiveLeafId()).toBeUndefined();
	});

	it("appends messages in a chain", () => {
		const store = new ConversationStore();
		store.appendMessage(makeMessage("user", "hello"));
		store.appendMessage(makeMessage("assistant", "hi there"));

		const messages = store.getMessages();
		expect(messages).toHaveLength(2);
		expect(messages[0]?.content).toBe("hello");
		expect(messages[1]?.content).toBe("hi there");

		const entries = store.getEntries();
		expect(entries[0]?.parentId).toBeNull();
		expect(entries[1]?.parentId).toBe(entries[0]?.id);
		expect(store.getActiveLeafId()).toBe(entries[1]?.id);
	});

	it("generates IDs for messages without them", () => {
		const store = new ConversationStore();
		store.appendMessage({ role: "user", content: "test" });

		const entries = store.getEntries();
		expect(entries[0]?.id).toBeTruthy();
	});

	it("preserves existing IDs", () => {
		const store = new ConversationStore();
		store.appendMessage({ id: "custom-id", role: "user", content: "test" });

		expect(store.getEntries()[0]?.id).toBe("custom-id");
		expect(store.getActiveLeafId()).toBe("custom-id");
	});

	it("replaceMessages links in a chain", () => {
		const store = new ConversationStore();
		store.replaceMessages([
			{ id: "a", role: "user", content: "1" },
			{ id: "b", role: "assistant", content: "2" },
			{ id: "c", role: "user", content: "3" },
		]);

		const entries = store.getEntries();
		expect(entries).toHaveLength(3);
		expect(entries[0]?.parentId).toBeNull();
		expect(entries[1]?.parentId).toBe("a");
		expect(entries[2]?.parentId).toBe("b");
		expect(store.getActiveLeafId()).toBe("c");
	});

	it("getMessages returns the active path", () => {
		const store = new ConversationStore();
		store.appendMessage(makeMessage("user", "hello"));
		store.appendMessage(makeMessage("assistant", "hi"));

		const messages = store.getMessages();
		expect(messages).toHaveLength(2);
		expect(messages[0]?.content).toBe("hello");
		expect(messages[1]?.content).toBe("hi");
	});

	it("resetForRun clears everything", () => {
		const store = new ConversationStore();
		store.appendMessage(makeMessage("user", "hello"));
		store.markSessionStarted();

		store.resetForRun();

		expect(store.getMessages()).toEqual([]);
		expect(store.getEntries()).toEqual([]);
		expect(store.getActiveLeafId()).toBeUndefined();
		expect(store.isSessionStarted()).toBe(false);
	});

	it("clearHistory clears everything", () => {
		const store = new ConversationStore();
		store.appendMessage(makeMessage("user", "hello"));

		store.clearHistory();

		expect(store.getMessages()).toEqual([]);
		expect(store.getEntries()).toEqual([]);
	});
});

describe("ConversationStore — restore", () => {
	it("restores linear messages as a linked list", () => {
		const store = new ConversationStore();
		store.restore([
			{ id: "a", role: "user", content: "1" },
			{ id: "b", role: "assistant", content: "2" },
			{ id: "c", role: "user", content: "3" },
		]);

		const entries = store.getEntries();
		expect(entries).toHaveLength(3);
		expect(entries[0]?.parentId).toBeNull();
		expect(entries[1]?.parentId).toBe("a");
		expect(entries[2]?.parentId).toBe("b");
		expect(store.getActiveLeafId()).toBe("c");
	});

	it("restores tree messages with existing parentId", () => {
		const store = new ConversationStore();
		store.restore([
			{ id: "a", role: "user", content: "1", parentId: null },
			{ id: "b", role: "assistant", content: "2", parentId: "a" },
			{ id: "c", role: "user", content: "3 (branch)", parentId: "a" },
		]);

		const entries = store.getEntries();
		expect(entries).toHaveLength(3);
		expect(entries[2]?.parentId).toBe("a");
	});

	it("restores with explicit activeLeafId", () => {
		const store = new ConversationStore();
		store.restore(
			[
				{ id: "a", role: "user", content: "1", parentId: null },
				{ id: "b", role: "assistant", content: "2", parentId: "a" },
				{ id: "c", role: "user", content: "3", parentId: "b" },
			],
			{ activeLeafId: "b" },
		);

		const messages = store.getMessages();
		expect(messages.map((m) => m.id)).toEqual(["a", "b"]);
		expect(store.getActiveLeafId()).toBe("b");
	});

	it("restore via constructor with options", () => {
		const messages: MessageWithMetadata[] = [
			{ id: "a", role: "user", content: "1", parentId: null },
			{ id: "b", role: "assistant", content: "2", parentId: "a" },
		];

		const store = new ConversationStore(messages, { activeLeafId: "a" });

		expect(store.getMessages().map((m) => m.id)).toEqual(["a"]);
		expect(store.getActiveLeafId()).toBe("a");
	});
});

describe("ConversationStore — tree mode", () => {
	it("switchLeaf changes the active path", () => {
		const store = new ConversationStore();
		store.restore([
			{ id: "a", role: "user", content: "1", parentId: null },
			{ id: "b", role: "assistant", content: "2", parentId: "a" },
			{ id: "c", role: "user", content: "3", parentId: "b" },
		]);

		expect(store.switchLeaf("b")).toBe(true);

		const messages = store.getMessages();
		expect(messages.map((m) => m.id)).toEqual(["a", "b"]);
		expect(store.getActiveLeafId()).toBe("b");
	});

	it("switchLeaf returns false for nonexistent entry", () => {
		const store = new ConversationStore();
		store.restore([{ id: "a", role: "user", content: "1", parentId: null }]);

		expect(store.switchLeaf("nonexistent")).toBe(false);
	});

	it("branchFrom creates a new branch", () => {
		const store = new ConversationStore();
		store.restore([
			{ id: "a", role: "user", content: "1", parentId: null },
			{ id: "b", role: "assistant", content: "2", parentId: "a" },
			{ id: "c", role: "user", content: "3", parentId: "b" },
		]);

		expect(store.branchFrom("b")).toBe(true);
		store.appendMessage(makeMessage("user", "new branch"));

		const entries = store.getEntries();
		expect(entries).toHaveLength(4);

		const newEntry = entries[3];
		expect(newEntry?.parentId).toBe("b");
		expect(store.getActiveLeafId()).toBe(newEntry?.id);

		const activeMessages = store.getMessages();
		expect(activeMessages).toHaveLength(3);
		expect(activeMessages[0]?.id).toBe("a");
		expect(activeMessages[1]?.id).toBe("b");
		expect(activeMessages[2]?.id).toBe(newEntry?.id);
	});

	it("abandoned branch entries are preserved", () => {
		const store = new ConversationStore();
		store.restore([
			{ id: "a", role: "user", content: "1", parentId: null },
			{ id: "b", role: "assistant", content: "2", parentId: "a" },
			{ id: "c", role: "user", content: "3", parentId: "b" },
		]);

		store.branchFrom("b");
		store.appendMessage(makeMessage("user", "alt approach"));

		const entries = store.getEntries();
		expect(entries).toHaveLength(4);

		const entryC = entries.find((e) => e.id === "c");
		expect(entryC).toBeDefined();
		expect(entryC?.content).toBe("3");
	});

	it("replaceMessages in tree mode preserves entries from other branches", () => {
		const store = new ConversationStore();
		store.restore([
			{ id: "a", role: "user", content: "1", parentId: null },
			{ id: "b", role: "assistant", content: "2", parentId: "a" },
			{ id: "c", role: "user", content: "3", parentId: "b" },
		]);

		store.branchFrom("b");
		store.appendMessage(makeMessage("user", "alt approach", "d"));

		const entriesBeforeReplace = store.getEntries();
		expect(entriesBeforeReplace).toHaveLength(4);

		store.replaceMessages([
			{ id: "a", role: "user", content: "1" },
			{ id: "b", role: "assistant", content: "2" },
			{ id: "d", role: "user", content: "alt approach" },
		]);

		const entries = store.getEntries();
		const entryC = entries.find((e) => e.id === "c");
		expect(entryC).toBeDefined();
		expect(entryC?.content).toBe("3");
	});
});

describe("ConversationStore — appendMessages", () => {
	it("appends multiple messages in order", () => {
		const store = new ConversationStore();
		store.appendMessages([
			makeMessage("user", "first"),
			makeMessage("assistant", "second"),
			makeMessage("user", "third"),
		]);

		const messages = store.getMessages();
		expect(messages).toHaveLength(3);
		expect(messages[0]?.content).toBe("first");
		expect(messages[2]?.content).toBe("third");

		const entries = store.getEntries();
		expect(entries[1]?.parentId).toBe(entries[0]?.id);
		expect(entries[2]?.parentId).toBe(entries[1]?.id);
	});

	it("does nothing for empty array", () => {
		const store = new ConversationStore();
		store.appendMessage(makeMessage("user", "hello"));
		store.appendMessages([]);

		expect(store.getMessages()).toHaveLength(1);
	});
});

describe("ConversationStore — session started gate", () => {
	it("starts not started", () => {
		const store = new ConversationStore();
		expect(store.isSessionStarted()).toBe(false);
	});

	it("markSessionStarted sets the flag", () => {
		const store = new ConversationStore();
		store.markSessionStarted();
		expect(store.isSessionStarted()).toBe(true);
	});

	it("resetForRun clears the flag", () => {
		const store = new ConversationStore();
		store.markSessionStarted();
		store.resetForRun();
		expect(store.isSessionStarted()).toBe(false);
	});

	it("restore clears the flag", () => {
		const store = new ConversationStore();
		store.markSessionStarted();
		store.restore([makeMessage("user", "x")]);
		expect(store.isSessionStarted()).toBe(false);
	});
});
