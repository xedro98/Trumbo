import type { LocalSlashCommandInvocation } from "../utils/skill-command-input";
import type { OpenConfigOptions } from "./use-config-panel";

export interface LocalSlashCommandActionInput {
	name: string;
	openAccount: () => void;
	openConfig: (options?: OpenConfigOptions) => void;
	openMcpManager: () => Promise<boolean>;
	openModelSelector: () => void;
	openSkills: (invocation?: LocalSlashCommandInvocation) => void;
	invocation?: LocalSlashCommandInvocation;
	runCompact: (focus?: string) => void;
	runFork: () => void;
	runClone: () => void;
	runUndo: () => Promise<void>;
	openTree: () => void;
	setSessionName: (name: string) => void;
	openHotkeys: () => void;
	openChangelog: () => void;
	reloadConfig: () => void;
	clearConversation: () => Promise<void>;
	openHelp: () => void;
	openHistory: () => void;
	exitTrumbo: () => void;
}

export function runLocalSlashCommandAction(
	input: LocalSlashCommandActionInput,
): boolean | Promise<boolean> {
	const normalized = input.name;
	if (normalized === "config" || normalized === "settings") {
		input.openConfig();
		return true;
	}
	if (normalized === "plugins") {
		input.openConfig({ initialTab: "plugins" });
		return true;
	}
	if (normalized === "skills") {
		input.openSkills(input.invocation);
		return true;
	}
	if (normalized === "mcp") {
		return input.openMcpManager().then(() => true);
	}
	if (normalized === "account") {
		input.openAccount();
		return true;
	}
	if (normalized === "model") {
		input.openModelSelector();
		return true;
	}
	if (normalized === "compact") {
		const focusArg = input.invocation?.text
			?.replace(/^\/compact\s*/i, "")
			.trim();
		input.runCompact(focusArg || undefined);
		return true;
	}
	if (normalized === "fork") {
		input.runFork();
		return true;
	}
	if (normalized === "undo") {
		return input.runUndo().then(() => true);
	}
	if (normalized === "tree") {
		input.openTree();
		return true;
	}
	if (normalized === "name") {
		const nameArg = input.invocation?.text?.replace(/^\/name\s*/i, "").trim();
		if (nameArg) {
			input.setSessionName(nameArg);
		}
		return true;
	}
	if (normalized === "clone") {
		input.runClone();
		return true;
	}
	if (normalized === "hotkeys") {
		input.openHotkeys();
		return true;
	}
	if (normalized === "changelog") {
		input.openChangelog();
		return true;
	}
	if (normalized === "reload") {
		input.reloadConfig();
		return true;
	}
	if (normalized === "clear") {
		return input.clearConversation().then(() => true);
	}
	if (normalized === "help") {
		input.openHelp();
		return true;
	}
	if (normalized === "history") {
		input.openHistory();
		return true;
	}
	if (normalized === "quit") {
		setTimeout(input.exitTrumbo, 0);
		return true;
	}
	return false;
}
