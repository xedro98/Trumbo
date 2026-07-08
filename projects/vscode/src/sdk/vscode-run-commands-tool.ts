/**
 * Custom `run_commands` tool that replaces the SDK's built-in version.
 *
 * This is an IDE-level feature built on top of the SDK, NOT part of the SDK.
 * It supports two execution modes, switchable dynamically per invocation:
 *
 *   - **Foreground (vscodeTerminal):** Uses VscodeTerminalManager for visible
 *     VS Code terminals with shell integration.
 *
 *   - **Background (backgroundExec):** Delegates to the SDK's createShellExecutor()
 *     for headless child_process.spawn execution.
 */

import {
	createShellExecutor,
	createShellTool,
	MAX_COMMAND_OUTPUT_CHARS,
	type ShellExecutor,
	type StructuredCommandInput,
	truncateCommandOutput,
} from "@trumbo/core"
import type { AgentTool } from "@trumbo/shared"
import { StateManager } from "@/core/storage/StateManager"
import { orchestrateCommandExecution } from "@/integrations/terminal/CommandOrchestrator"
import type { CommandExecutorCallbacks, ITerminalManager, TerminalProcessResultPromise } from "@/integrations/terminal/types"
import { Logger } from "@/shared/services/Logger"
import { getShellForProfile } from "@/utils/shell"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ShellCommand = string | StructuredCommandInput

/** Options for creating the VSCode run_commands tool. */
export interface VscodeRunCommandsToolOptions {
	/** Workspace root directory. */
	cwd: string
	/** Lazy factory for the VscodeTerminalManager. Called once on first foreground use. */
	getTerminalManager: () => ITerminalManager
	/** Callbacks for foreground command UI orchestration (Proceed While Running, etc.). */
	getCommandExecutorCallbacks?: () => CommandExecutorCallbacks | undefined
	/** Notified when a foreground terminal process starts so the host can cancel it later. */
	onForegroundProcessStarted?: (process: TerminalProcessResultPromise) => void
}

// ---------------------------------------------------------------------------
// Foreground execution — VscodeTerminalManager
// ---------------------------------------------------------------------------

function quoteShellArg(arg: string): string {
	if (arg.length === 0) {
		return "''"
	}
	if (!/[\s"'\\$`!&|;<>(){}[\]*?~]/.test(arg)) {
		return arg
	}
	return `'${arg.replace(/'/g, `'\\''`)}'`
}

export function formatCommandForTerminal(command: ShellCommand): string {
	if (typeof command === "string") {
		return command
	}
	if (!("args" in command)) {
		return command.command
	}
	return [command.command, ...(command.args ?? [])].map(quoteShellArg).join(" ")
}

async function executeForeground(
	command: ShellCommand,
	cwd: string,
	terminalManager: ITerminalManager,
	maxOutputChars: number,
	abortSignal?: AbortSignal,
	options?: Pick<VscodeRunCommandsToolOptions, "getCommandExecutorCallbacks" | "onForegroundProcessStarted">,
): Promise<string> {
	const terminalCommand = formatCommandForTerminal(command)
	const terminalInfo = await terminalManager.getOrCreateTerminal(cwd)
	terminalInfo.terminal.show()

	const process = terminalManager.runCommand(terminalInfo, terminalCommand)
	options?.onForegroundProcessStarted?.(process)

	const callbacks = options?.getCommandExecutorCallbacks?.()
	if (callbacks) {
		if (abortSignal) {
			const onAbort = () => {
				callbacks.resolvePendingAsk?.("noButtonClicked")
				process.continue()
			}
			const cleanupAbortListener = () => abortSignal.removeEventListener("abort", onAbort)
			abortSignal.addEventListener("abort", onAbort, { once: true })
			process.once("completed", cleanupAbortListener)
			process.once("continue", cleanupAbortListener)
		}

		const result = await orchestrateCommandExecution(process, terminalManager, callbacks, {
			command: terminalCommand,
			terminalType: "vscode",
		})
		if (abortSignal?.aborted) {
			throw new Error("Command execution aborted")
		}
		return truncateCommandOutput(String(result.result ?? ""), {
			maxChars: maxOutputChars,
		})
	}

	const outputLines: string[] = []
	process.on("line", (line: string) => {
		outputLines.push(line)
	})

	if (abortSignal) {
		const onAbort = () => {
			process.continue()
		}
		const cleanupAbortListener = () => abortSignal.removeEventListener("abort", onAbort)
		abortSignal.addEventListener("abort", onAbort, { once: true })
		process.once("completed", cleanupAbortListener)
		process.once("continue", cleanupAbortListener)
	}

	await process
	if (abortSignal?.aborted) {
		throw new Error("Command execution aborted")
	}

	return truncateCommandOutput(outputLines.join("\n").trim(), {
		maxChars: maxOutputChars,
	})
}

// ---------------------------------------------------------------------------
// Tool factory
// ---------------------------------------------------------------------------

/**
 * Creates the custom `run_commands` tool for the VSCode extension.
 *
 * This tool suppresses and replaces the SDK's built-in `run_commands` tool.
 * It reads `vscodeTerminalExecutionMode` from StateManager on every invocation
 * to dynamically switch between foreground (visible terminal) and background
 * (child_process.spawn) execution.
 */
export function createVscodeRunCommandsTool(options: VscodeRunCommandsToolOptions): AgentTool {
	return createShellTool(createVscodeShellExecutor(options), {
		cwd: options.cwd,
	})
}

function createVscodeShellExecutor(options: VscodeRunCommandsToolOptions): ShellExecutor {
	const { cwd, getTerminalManager } = options

	let bgExecutor: ShellExecutor | undefined
	let bgExecutorShell: string | undefined
	let terminalManager: ITerminalManager | undefined

	return async (command, commandCwd, context): Promise<string> => {
		const mode = StateManager.get().getGlobalStateKey("vscodeTerminalExecutionMode") ?? "vscodeTerminal"

		Logger.log(`[VscodeRunCommands] Executing command in ${mode} mode`)

		if (mode === "backgroundExec") {
			const profileId = (StateManager.get().getGlobalSettingsKey("defaultTerminalProfile") as string) || "default"
			const shell = getShellForProfile(profileId)

			if (!bgExecutor || bgExecutorShell !== shell) {
				bgExecutorShell = shell
				bgExecutor = createShellExecutor({
					shell,
					env: { SHELL: shell },
				})
				Logger.log(`[VscodeRunCommands] Background executor using shell: ${shell}`)
			}
			return await bgExecutor(command, commandCwd || cwd, context)
		}

		if (!terminalManager) {
			terminalManager = getTerminalManager()
		}
		return await executeForeground(
			command,
			commandCwd || cwd,
			terminalManager,
			MAX_COMMAND_OUTPUT_CHARS,
			context.signal,
			options,
		)
	}
}
