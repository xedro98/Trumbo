// @jsxImportSource @opentui/react
import { useTerminalDimensions } from "@opentui/react";
import type { ChoiceContext } from "@opentui-ui/dialog";
import { useDialog } from "@opentui-ui/dialog/react";
import { useCallback } from "react";
import type { SlashCommandRegistry } from "../commands/slash-command-registry";
import { resolveSlashCommand } from "../commands/slash-command-registry";
import { ForkConfirmContent } from "../components/dialogs/fork-confirm";
import { HelpDialogContent } from "../components/dialogs/help-dialog";
import { withLoadingDialog } from "../components/dialogs/loading-dialog";
import { useSession } from "../contexts/session-context";
import { palette } from "../palette";
import type { AppView, TuiProps } from "../types";
import { formatCompactionStatus } from "../utils/compaction-status";
import { hydrateSessionMessages } from "../utils/hydrate-messages";
import { loadScopedModels } from "../utils/scoped-models";
import type { LocalSlashCommandInvocation } from "../utils/skill-command-input";
import { HistoryDialogContent } from "../views/history-view";
import { runLocalSlashCommandAction } from "./local-command-actions";
import type { OpenConfigOptions } from "./use-config-panel";

export function useLocalCommandActions(input: {
	slashCommandRegistry: SlashCommandRegistry;
	canForkSession: boolean;
	openAccount: () => void;
	openConfig: (options?: OpenConfigOptions) => void;
	openMcpManager: () => Promise<boolean>;
	openModelSelector: () => void;
	openSkills: (invocation?: LocalSlashCommandInvocation) => void;
	refocusTextarea: () => void;
	setAppView: (view: AppView) => void;
	onClearConversation: () => Promise<void>;
	onResumeSession: TuiProps["onResumeSession"];
	onCompact: TuiProps["onCompact"];
	onFork: TuiProps["onFork"];
	onClone: TuiProps["onClone"];
	onRenameSession: TuiProps["onRenameSession"];
	onUndo: () => Promise<void>;
	onExit: TuiProps["onExit"];
	openTree: () => void;
	onReloadConfig: () => Promise<void>;
	onTrustWorkspace: () => Promise<void>;
}) {
	const dialog = useDialog();
	const session = useSession();
	const { height: termHeight } = useTerminalDimensions();
	const {
		slashCommandRegistry,
		canForkSession,
		openAccount,
		openConfig,
		openMcpManager,
		openModelSelector,
		openSkills,
		refocusTextarea,
		setAppView,
		onClearConversation,
		onResumeSession,
		onCompact,
		onFork,
		onClone,
		onRenameSession,
		onUndo,
		onExit,
		openTree,
		onReloadConfig,
		onTrustWorkspace,
	} = input;

	const openHistory = useCallback(async () => {
		const sessionId = await dialog.choice<string>({
			size: "large",
			style: { maxHeight: termHeight - 2 },
			content: (ctx: ChoiceContext<string>) => (
				<HistoryDialogContent {...ctx} />
			),
		});
		if (sessionId) {
			try {
				await withLoadingDialog(dialog, "Loading session...", async () => {
					const result = await onResumeSession(sessionId);
					const { messages } = result;
					const entries = hydrateSessionMessages(messages);
					if (entries.length === 0) {
						session.appendEntry({
							kind: "error",
							text: `Session ${sessionId} has no messages to resume.`,
						});
					} else {
						session.clearEntries();
						for (const entry of entries) {
							session.appendEntry(entry);
						}
						if (typeof result.currentContextSize === "number") {
							session.setLastTotalTokens(result.currentContextSize);
						}
						if (typeof result.totalCost === "number") {
							session.setLastTotalCost(result.totalCost);
						}
						session.setHasSubmitted(true);
						setAppView("chat");
					}
				});
			} catch (error) {
				session.appendEntry({
					kind: "error",
					text: `Failed to resume session: ${error instanceof Error ? error.message : String(error)}`,
				});
			}
		}
		refocusTextarea();
	}, [
		dialog,
		onResumeSession,
		refocusTextarea,
		session,
		setAppView,
		termHeight,
	]);

	const openHelp = useCallback(async () => {
		await dialog.choice<void>({
			size: "large",
			style: { maxHeight: termHeight - 2 },
			content: (ctx: ChoiceContext<void>) => <HelpDialogContent {...ctx} />,
		});
		refocusTextarea();
	}, [dialog, refocusTextarea, termHeight]);

	const runCompact = useCallback(
		async (focus?: string) => {
			session.appendEntry({
				kind: "status",
				text: focus
					? `Compacting context (focus: ${focus.slice(0, 60)})...`
					: "Compacting context...",
			});
			try {
				const result = await onCompact(focus);
				session.updateLastEntry(() => ({
					kind: "status",
					text: formatCompactionStatus(result),
				}));
			} catch (error) {
				session.appendEntry({
					kind: "error",
					text: `Compaction failed: ${error instanceof Error ? error.message : String(error)}`,
				});
			}
		},
		[onCompact, session],
	);

	const runFork = useCallback(async () => {
		if (!canForkSession) {
			session.appendEntry({
				kind: "status",
				text: "Fork is available after this session has messages.",
			});
			return;
		}
		const confirmed = await dialog.choice<boolean>({
			closeOnEscape: true,
			content: (ctx: ChoiceContext<boolean>) => <ForkConfirmContent {...ctx} />,
		});
		refocusTextarea();
		if (!confirmed) return;
		session.appendEntry({
			kind: "status",
			text: "Creating forked session...",
		});
		try {
			const result = await onFork();
			if (result) {
				session.updateLastEntry(() => ({
					kind: "status",
					text: `Forked into new session ${result.newSessionId}. This is now the active session. Use /history to switch sessions.`,
				}));
			} else {
				session.updateLastEntry(() => ({
					kind: "error",
					text: "Fork failed: could not read messages from the current session.",
				}));
			}
		} catch (error) {
			session.updateLastEntry(() => ({
				kind: "error",
				text: `Fork failed: ${error instanceof Error ? error.message : String(error)}`,
			}));
		}
	}, [canForkSession, dialog, onFork, refocusTextarea, session]);

	const runClone = useCallback(async () => {
		if (!canForkSession) {
			session.appendEntry({
				kind: "status",
				text: "Clone is available after this session has messages.",
			});
			return;
		}
		session.appendEntry({
			kind: "status",
			text: "Cloning current session...",
		});
		try {
			const result = await onClone();
			if (result) {
				session.updateLastEntry(() => ({
					kind: "status",
					text: `Cloned into new session ${result.newSessionId}. The clone is now the active session.`,
				}));
			} else {
				session.updateLastEntry(() => ({
					kind: "error",
					text: "Clone failed: could not read messages from the current session.",
				}));
			}
		} catch (error) {
			session.updateLastEntry(() => ({
				kind: "error",
				text: `Clone failed: ${error instanceof Error ? error.message : String(error)}`,
			}));
		}
	}, [canForkSession, onClone, session]);

	const setSessionName = useCallback(
		(name: string) => {
			const trimmed = name.trim();
			if (!trimmed) {
				session.appendEntry({
					kind: "error",
					text: "Session name cannot be empty. Usage: /name <title>",
				});
				return;
			}
			void onRenameSession(trimmed)
				.then(() => {
					session.appendEntry({
						kind: "status",
						text: `Session renamed to "${trimmed}".`,
					});
				})
				.catch((error) => {
					session.appendEntry({
						kind: "error",
						text: `Failed to rename session: ${error instanceof Error ? error.message : String(error)}`,
					});
				});
		},
		[onRenameSession, session],
	);

	const openHotkeys = useCallback(async () => {
		await dialog.choice<void>({
			size: "large",
			style: { maxHeight: termHeight - 2 },
			content: (ctx: ChoiceContext<void>) => <HelpDialogContent {...ctx} />,
		});
		refocusTextarea();
	}, [dialog, refocusTextarea, termHeight]);

	const openChangelog = useCallback(async () => {
		await dialog.choice<void>({
			size: "large",
			style: { maxHeight: termHeight - 2 },
			content: (_ctx: ChoiceContext<void>) => (
				<box flexDirection="column" paddingX={1}>
					<text fg={palette.brand} marginBottom={1}>
						Changelog
					</text>
					<text fg="gray">
						<em>
							See https://github.com/xedro98/Trumbo/releases for the full
							changelog.
						</em>
					</text>
				</box>
			),
		});
		refocusTextarea();
	}, [dialog, refocusTextarea, termHeight]);

	const reloadConfig = useCallback(async () => {
		session.appendEntry({
			kind: "status",
			text: "Reloading extensions, skills, and config...",
		});
		try {
			await onReloadConfig();
			session.updateLastEntry(() => ({
				kind: "status",
				text: "Config reloaded successfully.",
			}));
		} catch (error) {
			session.updateLastEntry(() => ({
				kind: "error",
				text: `Reload failed: ${error instanceof Error ? error.message : String(error)}`,
			}));
		}
	}, [onReloadConfig, session]);

	const trustWorkspace = useCallback(async () => {
		session.appendEntry({
			kind: "status",
			text: "Marking this workspace as trusted...",
		});
		try {
			await onTrustWorkspace();
			session.updateLastEntry(() => ({
				kind: "status",
				text: "Workspace trusted. Restart Trumbo for project-local skills/rules/workflows to load.",
			}));
		} catch (error) {
			session.updateLastEntry(() => ({
				kind: "error",
				text: `Trust failed: ${error instanceof Error ? error.message : String(error)}`,
			}));
		}
	}, [onTrustWorkspace, session]);

	const showScopedModels = useCallback(() => {
		const cfg = loadScopedModels();
		if (cfg.models.length === 0) {
			session.appendEntry({
				kind: "status",
				text: "No scoped models configured. Add provider/model IDs to ~/.trumbo/scoped-models.json. Press Ctrl+M to cycle.",
			});
		} else {
			session.appendEntry({
				kind: "status",
				text: `Scoped models (${cfg.models.length}): ${cfg.models.join(", ")}. Press Ctrl+M to cycle.`,
			});
		}
	}, [session]);

	const handleSlashCommand = useCallback(
		(command: string, invocation?: LocalSlashCommandInvocation) => {
			const resolved = resolveSlashCommand(slashCommandRegistry, command);
			if (!resolved || resolved.execution !== "local") {
				return false;
			}
			return runLocalSlashCommandAction({
				name: resolved.name,
				invocation,
				openAccount,
				openConfig,
				openMcpManager,
				openModelSelector,
				openSkills,
				runCompact,
				runFork,
				runClone,
				runUndo: onUndo,
				openTree,
				openHotkeys,
				openChangelog,
				reloadConfig,
				trustWorkspace,
				showScopedModels,
				setSessionName,
				clearConversation: onClearConversation,
				openHelp,
				openHistory,
				exitTrumbo: onExit,
			});
		},
		[
			onClearConversation,
			onExit,
			onUndo,
			openAccount,
			openChangelog,
			openConfig,
			openHotkeys,
			openMcpManager,
			openHelp,
			openHistory,
			openModelSelector,
			openSkills,
			openTree,
			reloadConfig,
			runClone,
			runCompact,
			runFork,
			setSessionName,
			slashCommandRegistry,
			trustWorkspace,
			showScopedModels,
		],
	);

	return { handleSlashCommand };
}
