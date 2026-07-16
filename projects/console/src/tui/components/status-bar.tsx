import { useTerminalDimensions } from "@opentui/react";
import type { AgentMode } from "@trumbodev/core";
import {
	shouldShowCliUsageCost,
	shouldShowCliUsageCoveredBySubscription,
} from "../../utils/usage-cost-display";
import {
	useTerminalBackground,
	useTerminalTheme,
} from "../hooks/use-terminal-background";
import {
	getDefaultForeground,
	getMagicColor,
	getModeAccent,
	getSuccessColor,
	palette,
} from "../palette";
import { HOME_VIEW_MAX_WIDTH } from "../types";

export function createContextBar(
	used: number,
	total?: number,
	width = 8,
): { filled: string; empty: string } {
	const normalizedWidth = Math.max(0, Math.floor(width));
	const ratio = total && total > 0 ? Math.min(used / total, 1) : 0;
	const filledCount =
		total && total > 0 && used > 0
			? used >= total
				? normalizedWidth
				: Math.min(
						Math.max(1, Math.ceil(ratio * normalizedWidth)),
						Math.max(0, normalizedWidth - 1),
					)
			: 0;
	const emptyCount = Math.max(0, normalizedWidth - filledCount);
	return {
		filled: "\u2588".repeat(filledCount),
		empty: "\u2588".repeat(emptyCount),
	};
}

export function resolveContextBarFilledForeground(
	defaultForeground: string | undefined,
): string {
	return defaultForeground ?? "#ffffff";
}

function formatCost(cost: number): string {
	if (cost < 0.01) return `$${cost.toFixed(4)}`;
	return `$${cost.toFixed(2)}`;
}

function formatCostText(providerId: string, totalCost: number): string {
	if (shouldShowCliUsageCoveredBySubscription(providerId)) {
		return "$0.00 (included with subscription)";
	}

	if (!shouldShowCliUsageCost(providerId)) {
		return "";
	}

	return formatCost(totalCost);
}

export function formatStatusBarUsageText(input: {
	totalTokens: number;
	totalCost: number;
	providerId: string;
}): string {
	const tokens = `(${input.totalTokens.toLocaleString()} tokens)`;
	const costText = formatCostText(input.providerId, input.totalCost);

	if (!costText) {
		return tokens;
	}

	return `${tokens} ${costText}`;
}

// knownModels keys are bare IDs ("claude-sonnet-4-6") but config.modelId
// may include a provider prefix ("anthropic/claude-sonnet-4-6"), so we
// try the full ID first, then strip the prefix and retry.
function lookupModelInfo(
	modelId: string,
	knownModels?: Record<string, unknown>,
): { name?: string } | undefined {
	if (!knownModels) return undefined;
	const candidates = [modelId, modelId.split("/").pop()];
	for (const key of candidates) {
		if (!key) continue;
		const hit = knownModels[key] as { name?: string } | undefined;
		if (hit) return hit;
	}
	return undefined;
}

/** Quartz variants render as friendly model names even when knownModels is empty. */
const QUARTZ_DISPLAY_NAMES: Record<string, string> = {
	quartz: "Quartz",
	"quartz-lite": "Quartz Lite",
	"quartz-hyper": "Quartz Hyper",
};

export function resolveModelDisplayName(config: {
	providerId?: string;
	modelId: string;
	knownModels?: Record<string, unknown>;
	thinking?: boolean;
	reasoningEffort?: string;
}): string {
	const info = lookupModelInfo(config.modelId, config.knownModels);
	const modelIdTail = config.modelId.split("/").pop() ?? config.modelId;
	const quartzName = QUARTZ_DISPLAY_NAMES[config.modelId];
	const displayName =
		config.providerId === "trumbo-pass"
			? `TrumboPass/${modelIdTail}`
			: (info?.name ?? quartzName ?? modelIdTail);
	if (config.thinking && config.reasoningEffort) {
		return `${displayName} (${config.reasoningEffort})`;
	}
	return displayName;
}

export function resolveModelMaxInputTokens(config: {
	modelId: string;
	knownModels?: Record<string, unknown>;
}): number | undefined {
	const info = (lookupModelInfo(config.modelId, config.knownModels) ?? {}) as {
		maxInputTokens?: number;
		contextWindow?: number;
	};
	if (typeof info.maxInputTokens === "number" && info.maxInputTokens > 0) {
		return info.maxInputTokens;
	}
	if (typeof info.contextWindow === "number" && info.contextWindow > 0) {
		return info.contextWindow;
	}
	return undefined;
}

export interface StatusBarProps {
	providerId: string;
	modelId: string;
	totalTokens: number;
	totalCost: number;
	maxInputTokens?: number;
	uiMode: AgentMode;
	autoApproveAll: boolean;
	workspaceName: string;
	gitBranch: string | null;
	gitDiffStats: {
		files: number;
		additions: number;
		deletions: number;
	} | null;
	onToggleMode?: () => void;
	variant?: "home" | "chat";
	planTier?: string;
	fiveHourUsed?: number;
	fiveHourLimit?: number;
}

export function StatusBar(props: StatusBarProps) {
	const {
		modelId,
		totalTokens,
		totalCost,
		maxInputTokens,
		uiMode,
		autoApproveAll,
		workspaceName,
		gitBranch,
		gitDiffStats,
		onToggleMode,
		planTier,
		fiveHourUsed,
		fiveHourLimit,
	} = props;

	const { width } = useTerminalDimensions();
	const terminalBg = useTerminalBackground();
	const terminalTheme = useTerminalTheme();
	const defaultFg = getDefaultForeground(terminalBg);
	const contextBarFilledFg = resolveContextBarFilledForeground(defaultFg);
	const actAccent = getModeAccent("act", terminalTheme);
	const planAccent = getModeAccent("plan", terminalTheme);
	const successColor = getSuccessColor(terminalTheme);
	const magic = getMagicColor(terminalTheme);
	const hasMaxInputTokens =
		typeof maxInputTokens === "number" &&
		Number.isFinite(maxInputTokens) &&
		maxInputTokens > 0;
	const bar = hasMaxInputTokens
		? createContextBar(totalTokens, maxInputTokens)
		: undefined;

	const planIndicator =
		planTier && planTier !== "free"
			? `${planTier.charAt(0).toUpperCase() + planTier.slice(1)}`
			: undefined;
	const quotaIndicator =
		typeof fiveHourUsed === "number" && typeof fiveHourLimit === "number"
			? `${fiveHourUsed}/${fiveHourLimit}`
			: undefined;
	const planPrefix =
		planIndicator && quotaIndicator
			? `${planIndicator} · 5h: ${quotaIndicator} | `
			: planIndicator
				? `${planIndicator} | `
				: "";

	// Available content width after accounting for padding.
	// Home view: parent box is capped at 60 wide, status bar adds paddingX=1 (-2).
	// Chat view: status bar adds paddingX=1 (-2).
	const avail =
		props.variant === "home"
			? Math.min(width, HOME_VIEW_MAX_WIDTH) - 2
			: width - 2;

	// Row 1 layout: [plan · model + context info] .... [Plan/Act toggle]
	// When the full row doesn't fit, context info drops to its own row 2.
	// Model ID truncates with "..." before wrapping; toggle stays right-aligned.
	const toggleWidth = 20;
	const usageText = formatStatusBarUsageText({
		totalTokens,
		totalCost,
		providerId: props.providerId,
	});
	const contextText = bar
		? ` ${bar.filled}${bar.empty} ${usageText}`
		: ` ${usageText}`;
	const fullModelText = planPrefix + modelId;
	const firstRowFits =
		fullModelText.length + contextText.length + toggleWidth + 1 <= avail;
	const renderContextText = (withLeadingSpace: boolean) => (
		<>
			{withLeadingSpace && " "}
			{bar && (
				<>
					<span fg={contextBarFilledFg}>{bar.filled}</span>
					<span fg={palette.muted}>{bar.empty}</span>{" "}
				</>
			)}
			{usageText}
		</>
	);

	const modelMaxLen = Math.max(
		10,
		avail -
			toggleWidth -
			(firstRowFits ? contextText.length : 0) -
			1 -
			planPrefix.length,
	);
	const truncatedModel =
		modelId.length > modelMaxLen
			? `${modelId.slice(0, modelMaxLen - 3)}...`
			: modelId;

	// Repo row: [workspace (branch) | N files +X -Y]
	// Git stats stay visible; path/branch truncates with "..." when narrow.
	const hasGitDiff = gitDiffStats && gitDiffStats.files > 0;
	const gitSuffix = hasGitDiff
		? ` | ${gitDiffStats.files} file${gitDiffStats.files !== 1 ? "s" : ""} +${gitDiffStats.additions} -${gitDiffStats.deletions}`
		: "";
	const pathPart = workspaceName + (gitBranch ? ` (${gitBranch})` : "");
	const pathMax = Math.max(5, avail - gitSuffix.length);
	const truncatedPath =
		pathPart.length > pathMax
			? `${pathPart.slice(0, pathMax - 3)}...`
			: pathPart;
	return (
		<box flexDirection="column" paddingX={1}>
			<box flexDirection="row" justifyContent="space-between">
				<text fg={palette.muted}>
					<span fg={magic}>{"*"}</span>{" "}
					{planPrefix && <span fg={successColor}>{planPrefix}</span>}
					{truncatedModel}
					{firstRowFits && renderContextText(true)}
				</text>
				{/* biome-ignore lint/a11y/noStaticElementInteractions: OpenTUI boxes handle terminal mouse input. */}
				<box
					flexDirection="row"
					gap={1}
					flexShrink={0}
					onMouseDown={onToggleMode}
				>
					<text fg={uiMode === "plan" ? planAccent : palette.muted}>
						{uiMode === "plan" ? "*" : "\u25cb"} Plan
					</text>
					<text fg={palette.muted}>|</text>
					<text fg={uiMode === "act" ? actAccent : palette.muted}>
						{uiMode === "act" ? "*" : "\u25cb"} Act
					</text>
					<text fg={palette.muted}>(Tab)</text>
				</box>
			</box>

			{!firstRowFits && (
				<text fg={palette.muted}>{renderContextText(false)}</text>
			)}

			<text fg={defaultFg}>
				{truncatedPath}
				{hasGitDiff && (
					<span fg={palette.muted}>
						{" \u00b7 "}
						{gitDiffStats.files} file
						{gitDiffStats.files !== 1 ? "s" : ""}{" "}
						<span fg={successColor}>+{gitDiffStats.additions}</span>{" "}
						<span fg={palette.error}>-{gitDiffStats.deletions}</span>
					</span>
				)}
			</text>

			{autoApproveAll ? (
				<text fg={defaultFg}>
					<span fg={successColor}>
						{"\u23f5\u23f5"} Auto-approve all enabled
					</span>
					<span fg={palette.muted}> (Shift+Tab)</span>
				</text>
			) : (
				<text fg={palette.muted}>Auto-approve all disabled (Shift+Tab)</text>
			)}
		</box>
	);
}
