import { describe, expect, it, vi } from "vitest";
import { formatCompactionStatus } from "../utils/compaction-status";
import {
	type LocalSlashCommandActionInput,
	runLocalSlashCommandAction,
} from "./local-command-actions";

function makeActions(
	overrides: Partial<Omit<LocalSlashCommandActionInput, "name">> = {},
): Omit<LocalSlashCommandActionInput, "name"> {
	return {
		openAccount: vi.fn(),
		openConfig: vi.fn(),
		openMcpManager: vi.fn(async () => false),
		openModelSelector: vi.fn(),
		openSkills: vi.fn(),
		runCompact: vi.fn(),
		runFork: vi.fn(),
		runClone: vi.fn(),
		runUndo: vi.fn(async () => {}),
		openTree: vi.fn(),
		openHotkeys: vi.fn(),
		openChangelog: vi.fn(),
		reloadConfig: vi.fn(),
		setSessionName: vi.fn(),
		clearConversation: vi.fn(async () => {}),
		openHelp: vi.fn(),
		openHistory: vi.fn(),
		exitTrumbo: vi.fn(),
		...overrides,
	};
}

describe("runLocalSlashCommandAction", () => {
	it("opens the skills picker with skills", () => {
		const openSkills = vi.fn();
		const actions = makeActions({ openSkills });
		const invocation = {
			text: "please /skills",
			cursorOffset: "please /skills".length,
			replaceRange: { start: "please ".length, end: "please /skills".length },
		};

		const handled = runLocalSlashCommandAction({
			name: "skills",
			invocation,
			...actions,
		});

		expect(handled).toBe(true);
		expect(openSkills).toHaveBeenCalledWith(invocation);
	});

	it("opens settings to the plugins tab with plugins", () => {
		const openConfig = vi.fn();
		const actions = makeActions({ openConfig });

		const handled = runLocalSlashCommandAction({
			name: "plugins",
			...actions,
		});

		expect(handled).toBe(true);
		expect(openConfig).toHaveBeenCalledWith({ initialTab: "plugins" });
	});

	it("waits for clear to reset the runtime session", async () => {
		let resolveClear: (() => void) | undefined;
		const clearConversation = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveClear = resolve;
				}),
		);
		const actions = makeActions({ clearConversation });

		const handled = runLocalSlashCommandAction({
			name: "clear",
			...actions,
		});
		const handledPromise = Promise.resolve(handled);
		let settled = false;
		void handledPromise.then(() => {
			settled = true;
		});

		await Promise.resolve();

		expect(clearConversation).toHaveBeenCalledOnce();
		expect(settled).toBe(false);

		resolveClear?.();

		expect(await handledPromise).toBe(true);
		expect(settled).toBe(true);
	});

	it("waits for undo to finish restoring", async () => {
		let resolveUndo: (() => void) | undefined;
		const runUndo = vi.fn(
			() =>
				new Promise<void>((resolve) => {
					resolveUndo = resolve;
				}),
		);
		const actions = makeActions({ runUndo });

		const handled = runLocalSlashCommandAction({
			name: "undo",
			...actions,
		});
		const handledPromise = Promise.resolve(handled);
		let settled = false;
		void handledPromise.then(() => {
			settled = true;
		});

		await Promise.resolve();

		expect(runUndo).toHaveBeenCalledOnce();
		expect(settled).toBe(false);

		resolveUndo?.();

		expect(await handledPromise).toBe(true);
		expect(settled).toBe(true);
	});

	it("opens the tree navigator with tree", () => {
		const openTree = vi.fn();
		const actions = makeActions({ openTree });

		const handled = runLocalSlashCommandAction({
			name: "tree",
			...actions,
		});

		expect(openTree).toHaveBeenCalledOnce();
		expect(handled).toBe(true);
	});

	it("sets the session name with name", () => {
		const setSessionName = vi.fn();
		const actions = makeActions({ setSessionName });

		const handled = runLocalSlashCommandAction({
			name: "name",
			invocation: { text: "/name My Session", cursorOffset: 16 },
			...actions,
		});

		expect(setSessionName).toHaveBeenCalledWith("My Session");
		expect(handled).toBe(true);
	});

	it("does not set session name when no argument provided", () => {
		const setSessionName = vi.fn();
		const actions = makeActions({ setSessionName });

		const handled = runLocalSlashCommandAction({
			name: "name",
			invocation: { text: "/name", cursorOffset: 5 },
			...actions,
		});

		expect(setSessionName).not.toHaveBeenCalled();
		expect(handled).toBe(true);
	});

	it("clones the session with clone", () => {
		const runClone = vi.fn();
		const actions = makeActions({ runClone });

		const handled = runLocalSlashCommandAction({
			name: "clone",
			...actions,
		});

		expect(runClone).toHaveBeenCalledOnce();
		expect(handled).toBe(true);
	});

	it("exits Trumbo with quit", () => {
		vi.useFakeTimers();
		const exitTrumbo = vi.fn();
		const actions = makeActions({ exitTrumbo });

		try {
			const handled = runLocalSlashCommandAction({
				name: "quit",
				...actions,
			});

			expect(handled).toBe(true);
			expect(exitTrumbo).not.toHaveBeenCalled();

			vi.runAllTimers();

			expect(exitTrumbo).toHaveBeenCalledOnce();
		} finally {
			vi.useRealTimers();
		}
	});
});

describe("formatCompactionStatus", () => {
	it("reports when core did not return a compaction result", () => {
		expect(
			formatCompactionStatus({
				messagesBefore: 300,
				messagesAfter: 300,
				compacted: false,
			}),
		).toBe("No compaction needed.");
	});

	it("reports same-count compaction without implying no-op", () => {
		expect(
			formatCompactionStatus({
				messagesBefore: 300,
				messagesAfter: 300,
				compacted: true,
			}),
		).toBe("Compacted context; message count stayed at 300.");
	});

	it("reports empty sessions separately", () => {
		expect(
			formatCompactionStatus({
				messagesBefore: 0,
				messagesAfter: 0,
				compacted: false,
			}),
		).toBe("No messages to compact.");
	});
});
