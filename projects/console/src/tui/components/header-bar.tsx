import { useTerminalDimensions } from "@opentui/react";
import type { AgentMode } from "@trumbo/core";
import { useMemo } from "react";
import { useTerminalTheme } from "../hooks/use-terminal-background";
import { getMagicColor, getModeAccent, palette } from "../palette";
import { resolveModelDisplayName } from "./status-bar";

export interface HeaderBarProps {
	uiMode: AgentMode;
	providerId?: string;
	modelId: string;
	knownModels?: Record<string, unknown>;
	thinking?: boolean;
	reasoningEffort?: string;
	workspaceName: string;
	gitBranch: string | null;
}

export function HeaderBar(props: HeaderBarProps) {
	const { width } = useTerminalDimensions();
	const theme = useTerminalTheme();
	const accent = getModeAccent(props.uiMode, theme);
	const magic = getMagicColor(theme);

	const modelDisplayName = useMemo(
		() =>
			resolveModelDisplayName({
				providerId: props.providerId,
				modelId: props.modelId,
				knownModels: props.knownModels,
				thinking: props.thinking,
				reasoningEffort: props.reasoningEffort,
			}),
		[
			props.knownModels,
			props.modelId,
			props.providerId,
			props.reasoningEffort,
			props.thinking,
		],
	);

	const location = props.gitBranch
		? `${props.workspaceName} (${props.gitBranch})`
		: props.workspaceName;

	// Full-bleed rule under the header band: leading sparkle then a run of
	// horizontal bars filling the content width.
	const rulePad = 2;
	const sparkle = "* ";
	const barCount = Math.max(0, width - sparkle.length - rulePad);
	const rule = `${sparkle}${"\u2500".repeat(barCount)}`;

	return (
		<box flexDirection="column" flexShrink={0} paddingTop={1}>
			<box flexDirection="row" alignItems="center" gap={2} paddingX={1}>
				<text fg={accent}>
					<strong>{"*"} TRUMBO</strong>
				</text>
				<text
					fg={props.uiMode === "plan" ? getModeAccent("plan", theme) : accent}
				>
					{"\u25cf"} {props.uiMode === "plan" ? "Plan" : "Act"}
				</text>
				<text fg={palette.muted}>{modelDisplayName}</text>
				<text fg={palette.muted}>{"\u00b7"}</text>
				<text fg={magic}>{location}</text>
			</box>
			<box paddingX={1}>
				<text fg={palette.border}>{rule}</text>
			</box>
		</box>
	);
}
