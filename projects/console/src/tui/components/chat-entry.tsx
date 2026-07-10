import { useTerminalDimensions } from "@opentui/react";
import type { TrumboSubscriptionPlan } from "@trumbo/core";
import type React from "react";
import { useEffect, useState } from "react";
import "opentui-spinner/react";
import {
	getCliSubscriptionUrl,
	getIndividualPlanFeatures,
	getTrumboOrgIndividualInferenceSubscriptionMessage,
	isTrumboOrgIndividualInferenceSubscriptionErrorMessage,
	isTrumboPassSubscriptionError,
} from "../../utils/trumbo-pass-errors";
import { useTerminalBackground } from "../hooks/use-terminal-background";
import {
	getDefaultForeground,
	getMagicColor,
	getModeAccent,
	getModeInputBackground,
	getToolAccent,
	getUserColor,
	palette,
	type TerminalTheme,
} from "../palette";
import { TRUMBO_BILLING_URL } from "../trumbo-account";
import type { ChatEntry } from "../types";
import { getSyntaxStyle } from "../utils/syntax-style";
import { isWarningToolError } from "../utils/tool-errors";
import {
	parseApplyPatchInput,
	parseAskQuestionInput,
	parseEditorInput,
	parseReadFilesInput,
	parseRunCommandsInput,
	parseSearchInput,
	parseSpawnAgentInput,
	parseWebFetchInput,
	shortenPath,
} from "../utils/tool-parsing";
import { AccentRail } from "./accent-rail";
import { Avatar, type AvatarVariant, toolGlyph } from "./avatar";
import { ToolOutput } from "./tool-output";

function trimLeading(text: string): string {
	return text.replace(/^\n+/, "");
}

// The single layout primitive for every chat entry.
//
//   [indent?][avatar][content column]
//
// - "turns" (user / assistant) sit at the left edge with a bold role label
//   (You / Trumbo) so the transcript reads like a messenger.
// - "events" (tools / reasoning / status / errors) pass `indent` to nest two
//   columns in, under the active turn, with no label — they read as things the
//   assistant is doing, not as speakers.
// The avatar column is a fixed 2 cells; the content column gets a 1-cell gap
// after it. Every entry shares this skeleton so the left edge stays rhythmic.
function MessageShell(props: {
	variant: AvatarVariant;
	color: string;
	glyph?: string;
	streaming?: boolean;
	label?: string;
	indent?: boolean;
	children: React.ReactNode;
}) {
	const { variant, color, glyph, streaming, label, indent, children } = props;
	return (
		<box flexDirection="row">
			{indent && <box width={2} flexShrink={0} />}
			<Avatar
				variant={variant}
				color={color}
				glyph={glyph}
				streaming={streaming}
			/>
			<box flexGrow={1} flexDirection="column" paddingLeft={1}>
				{label && (
					<text fg={color}>
						<strong>{label}</strong>
					</text>
				)}
				{children}
			</box>
		</box>
	);
}

function formatToolParams(
	toolName: string,
	rawInput: unknown,
	fallback: string,
): React.ReactNode {
	switch (toolName) {
		case "read_files": {
			const info = parseReadFilesInput(rawInput);
			if (!info?.files.length) return fallback;
			return info.files.map((f, i) => {
				const sl = f.startLine != null ? String(f.startLine) : "undefined";
				const el = f.endLine != null ? String(f.endLine) : "undefined";
				const sep = i > 0 ? "; " : "";
				return (
					<span key={f.path}>
						{sep}
						{shortenPath(f.path)}
						<span fg="gray">
							, start_line={sl}, end_line={el}
						</span>
					</span>
				);
			});
		}
		case "run_commands": {
			const info = parseRunCommandsInput(rawInput);
			if (!info?.commands.length) return fallback;
			return info.commands.join(" && ");
		}
		case "editor":
		case "edit":
		case "write": {
			const info = parseEditorInput(rawInput);
			if (!info) return fallback;
			return shortenPath(info.path);
		}
		case "apply_patch": {
			const patchInfo = parseApplyPatchInput(rawInput);
			if (!patchInfo?.files.length) return fallback;
			return patchInfo.files.map((f) => shortenPath(f)).join(", ");
		}
		case "search_codebase": {
			const info = parseSearchInput(rawInput);
			if (!info?.queries.length) return fallback;
			return info.queries.join(", ");
		}
		case "fetch_web_content": {
			const info = parseWebFetchInput(rawInput);
			if (!info?.urls.length) return fallback;
			return info.urls.join(", ");
		}
		case "spawn_agent": {
			const info = parseSpawnAgentInput(rawInput);
			if (!info) return fallback;
			const task =
				info.task.length > 60 ? `${info.task.slice(0, 60)}...` : info.task;
			return task;
		}
		case "ask_question":
		case "ask_followup_question": {
			const info = parseAskQuestionInput(rawInput);
			if (!info) return fallback;
			const q =
				info.question.length > 60
					? `${info.question.slice(0, 60)}...`
					: info.question;
			return q;
		}
		case "switch_to_act_mode":
			return "";
		case "skills": {
			if (rawInput && typeof rawInput === "object" && "skill" in rawInput) {
				const s = String((rawInput as { skill: unknown }).skill);
				const args =
					"args" in rawInput
						? ` ${String((rawInput as { args: unknown }).args)}`
						: "";
				const full = `${s}${args}`;
				return full.length > 70 ? `${full.slice(0, 70)}...` : full;
			}
			return fallback;
		}
		default:
			return fallback;
	}
}

// Tool-call content (no avatar — MessageShell provides it): a header row with
// a status icon + tool name + params, then the indented result.
function ToolCallContent(props: {
	toolName: string;
	inputSummary: string;
	rawInput?: unknown;
	streaming: boolean;
	result?: {
		outputSummary: string;
		rawOutput?: unknown;
		error?: string;
	};
	toolAccent: string;
	defaultFg?: string;
}) {
	const { toolName, inputSummary, streaming, result, toolAccent, defaultFg } =
		props;
	const failed = result?.error != null;
	const warningFailure = isWarningToolError(result?.error);
	const params = formatToolParams(toolName, props.rawInput, inputSummary);

	return (
		<box flexDirection="column">
			<box flexDirection="row" gap={1}>
				<box width={1} flexShrink={0}>
					{streaming ? (
						<spinner name="dots" color="gray" />
					) : warningFailure ? (
						<text fg="yellow">!</text>
					) : failed ? (
						<text fg="red">x</text>
					) : (
						<text fg={palette.success}>+</text>
					)}
				</box>
				<text fg={defaultFg} selectable>
					<span fg={toolAccent}>
						<strong>{toolName}</strong>
					</span>
					<span fg="gray"> {"\u2192"} </span>
					<span>{params}</span>
				</text>
			</box>
			{result && (
				<box marginLeft={2}>
					<ToolOutput
						toolName={toolName}
						outputSummary={result.outputSummary}
						rawOutput={result.rawOutput}
						rawInput={props.rawInput}
						error={result.error}
					/>
				</box>
			)}
		</box>
	);
}

// Reasoning content (no avatar): collapsible thinking block. Streaming shows
// the live text under a "Thinking..." header; collapsed shows a one-line tail.
function ReasoningContent(props: {
	text: string;
	streaming: boolean;
	color: string;
}) {
	const [expanded, setExpanded] = useState(false);
	const { width } = useTerminalDimensions();
	const content = trimLeading(props.text);
	const { color } = props;

	if (!content.trim()) {
		if (props.streaming) {
			return (
				<text fg="gray">
					<em>Thinking...</em>
				</text>
			);
		}
		return null;
	}

	if (props.streaming) {
		const lines = content.split("\n");
		return (
			<box flexDirection="column">
				<text fg={color}>
					<em>Thinking...</em>
				</text>
				{lines.map((line) => (
					<text key={line} fg="gray" selectable>
						<em>{line || " "}</em>
					</text>
				))}
			</box>
		);
	}

	if (expanded) {
		const lines = content.split("\n");
		return (
			// biome-ignore lint/a11y/noStaticElementInteractions: OpenTUI boxes handle terminal mouse input.
			<box flexDirection="column" onMouseDown={() => setExpanded(false)}>
				<text fg={color}>
					<em>Thinking</em>
				</text>
				{lines.map((line) => (
					<text key={line} fg="gray" selectable>
						<em>{line || " "}</em>
					</text>
				))}
			</box>
		);
	}

	const padding = 8;
	const prefix = "> Thinking: ";
	const available = Math.max(10, width - padding - prefix.length - 3);
	const flat = content.replace(/\n/g, " ").trim();
	const tail =
		flat.length <= available
			? flat
			: `...${flat.slice(flat.length - available)}`;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: OpenTUI boxes handle terminal mouse input.
		<text fg="gray" selectable onMouseDown={() => setExpanded(true)}>
			<span fg={color}>{">"} </span>
			<em>Thinking: {tail}</em>
		</text>
	);
}

function RateLimitCard(props: { defaultFg?: string; text: string }) {
	const resetMatch = props.text.match(/Resets in ([^.]+)/i);
	const resetDuration = resetMatch?.[1]?.trim();
	const windowMatch = props.text.match(/(\w+)\s+window/i);
	const windowName = windowMatch?.[1]?.trim();

	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor="yellow"
			paddingX={1}
			gap={0}
		>
			<text fg="yellow">Rate limit reached</text>
			<text fg={props.defaultFg}>
				{windowName
					? `You've hit the ${windowName} request limit for your plan.`
					: "You've hit a request limit for your plan."}
			</text>
			{resetDuration && (
				<text fg="gray">Resets in {resetDuration}. Try again then.</text>
			)}
			<text fg="gray">Upgrade at {TRUMBO_BILLING_URL} for higher limits.</text>
		</box>
	);
}

function isRateLimitErrorMessage(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return (
		normalized.includes("rate limit") &&
		(normalized.includes("rate_limit_error") ||
			normalized.includes("rate limit exceeded") ||
			normalized.includes("resets in"))
	);
}

function TrumboPassSubscriptionCard(props: {
	defaultFg?: string;
	loadIndividualSubscriptionPlans?: () => Promise<TrumboSubscriptionPlan[]>;
	terminalTheme: TerminalTheme;
}) {
	const subscriptionUrl = getCliSubscriptionUrl();
	const [planFeatures, setPlanFeatures] = useState<string[]>([]);
	const planAccent = getModeAccent("plan", props.terminalTheme);

	useEffect(() => {
		if (!props.loadIndividualSubscriptionPlans) {
			return;
		}
		let isMounted = true;
		void props
			.loadIndividualSubscriptionPlans()
			.then((plans) => {
				if (isMounted) {
					setPlanFeatures(getIndividualPlanFeatures(plans));
				}
			})
			.catch(() => {
				// Keep the subscription error view usable if plan metadata is unavailable.
			});

		return () => {
			isMounted = false;
		};
	}, [props.loadIndividualSubscriptionPlans]);

	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor={planAccent}
			paddingX={1}
		>
			<text fg={planAccent}>TrumboPass subscription required</text>
			<text
				fg={props.defaultFg}
				selectable
				content="No access to TrumboPass subscription models yet. Subscribe to TrumboPass, the low cost open weights model coding plan."
			/>
			{planFeatures.length > 0 && (
				<box flexDirection="column" marginTop={1}>
					<text fg={props.defaultFg}>TrumboPass includes:</text>
					{planFeatures.map((feature) => (
						<text key={feature} fg={props.defaultFg} selectable>
							<span fg={palette.brand}>{"+"} </span>
							<span>{feature}</span>
						</text>
					))}
				</box>
			)}
			<box flexDirection="row">
				<text fg="gray">Subscribe: </text>
				<text fg={palette.brand} selectable>
					<a href={subscriptionUrl}>Open subscription page</a>
				</text>
			</box>
			<box flexDirection="row">
				<text fg="gray">URL: </text>
				<text fg={palette.brand} selectable>
					<a href={subscriptionUrl}>{subscriptionUrl}</a>
				</text>
			</box>
		</box>
	);
}

function TrumboOrgIndividualInferenceSubscriptionCard(props: {
	defaultFg?: string;
	terminalTheme: TerminalTheme;
}) {
	const planAccent = getModeAccent("plan", props.terminalTheme);

	return (
		<box
			flexDirection="column"
			border
			borderStyle="rounded"
			borderColor={planAccent}
			paddingX={1}
		>
			<text fg={planAccent}>Personal TrumboPass required</text>
			<text
				fg={props.defaultFg}
				selectable
				content={getTrumboOrgIndividualInferenceSubscriptionMessage()}
			/>
		</box>
	);
}

export function ChatEntryView(props: {
	entry: ChatEntry;
	accent?: string;
	loadIndividualSubscriptionPlans?: () => Promise<TrumboSubscriptionPlan[]>;
	terminalTheme: TerminalTheme;
}) {
	const { entry, accent = palette.act, terminalTheme } = props;
	const terminalBg = useTerminalBackground();
	const defaultFg = getDefaultForeground(terminalBg);
	const userColor = getUserColor(terminalTheme);
	const toolAccent = getToolAccent(terminalTheme);
	const magic = getMagicColor(terminalTheme);
	const userMsgBg = getModeInputBackground(
		accent === palette.plan ? "plan" : "act",
		terminalBg,
	);

	switch (entry.kind) {
		case "user":
			return (
				<MessageShell variant="user" color={userColor} label="You">
					<box
						border
						borderStyle="rounded"
						borderColor={userColor}
						backgroundColor={userMsgBg}
						paddingX={1}
					>
						<text fg={defaultFg} selectable>
							{entry.text}
						</text>
					</box>
				</MessageShell>
			);

		case "user_submitted":
			return (
				<MessageShell variant="user" color={userColor} label="You">
					<box
						border
						borderStyle="rounded"
						borderColor={userColor}
						backgroundColor={userMsgBg}
						paddingX={1}
					>
						{entry.delivery === "steer" && (
							<text fg="yellow">{"> steer  "}</text>
						)}
						{entry.delivery === "queue" && (
							<text fg="gray">{"> queued  "}</text>
						)}
						<text fg={defaultFg} selectable>
							{entry.text}
						</text>
					</box>
				</MessageShell>
			);

		case "assistant_text": {
			const content = trimLeading(entry.text);
			if (!content.trim()) return null;
			return (
				<MessageShell
					variant="assistant"
					color={accent}
					label="Trumbo"
					streaming={entry.streaming}
				>
					<AccentRail color={accent}>
						<markdown
							content={content}
							syntaxStyle={getSyntaxStyle(terminalTheme)}
							streaming={entry.streaming}
							fg={defaultFg}
						/>
					</AccentRail>
				</MessageShell>
			);
		}

		case "reasoning":
			return (
				<MessageShell
					variant="reasoning"
					color={magic}
					streaming={entry.streaming}
					indent
				>
					<ReasoningContent
						text={entry.text}
						streaming={entry.streaming}
						color={magic}
					/>
				</MessageShell>
			);

		case "tool_call":
			return (
				<MessageShell
					variant="tool"
					color={toolAccent}
					glyph={toolGlyph(entry.toolName)}
					indent
				>
					<ToolCallContent
						toolName={entry.toolName}
						inputSummary={entry.inputSummary}
						rawInput={entry.rawInput}
						streaming={entry.streaming}
						result={entry.result}
						toolAccent={toolAccent}
						defaultFg={defaultFg}
					/>
				</MessageShell>
			);

		case "error":
			if (isRateLimitErrorMessage(entry.text)) {
				return (
					<MessageShell variant="error" color="yellow" indent>
						<RateLimitCard defaultFg={defaultFg} text={entry.text} />
					</MessageShell>
				);
			}
			if (isTrumboOrgIndividualInferenceSubscriptionErrorMessage(entry.text)) {
				return (
					<MessageShell
						variant="error"
						color={getModeAccent("plan", terminalTheme)}
						indent
					>
						<TrumboOrgIndividualInferenceSubscriptionCard
							defaultFg={defaultFg}
							terminalTheme={terminalTheme}
						/>
					</MessageShell>
				);
			}
			if (isTrumboPassSubscriptionError(entry.text)) {
				return (
					<MessageShell
						variant="error"
						color={getModeAccent("plan", terminalTheme)}
						indent
					>
						<TrumboPassSubscriptionCard
							defaultFg={defaultFg}
							loadIndividualSubscriptionPlans={
								props.loadIndividualSubscriptionPlans
							}
							terminalTheme={terminalTheme}
						/>
					</MessageShell>
				);
			}
			return (
				<MessageShell variant="error" color="red" indent>
					<text fg="red" selectable content={`Error: ${entry.text}`} />
				</MessageShell>
			);

		case "status":
			return (
				<MessageShell variant="system" color="gray" indent>
					<text fg="gray" selectable content={entry.text} />
				</MessageShell>
			);

		case "team":
			return (
				<MessageShell variant="system" color="gray" indent>
					<text fg="gray" selectable content={entry.text} />
				</MessageShell>
			);

		case "done": {
			const parts: string[] = [];
			if (entry.elapsed) parts.push(`${entry.elapsed}s`);
			if (entry.tokens > 0)
				parts.push(`${entry.tokens.toLocaleString()} tokens`);
			if (entry.cost > 0) parts.push(`$${entry.cost.toFixed(3)}`);
			if (entry.iterations > 0)
				parts.push(
					`${entry.iterations} iteration${entry.iterations !== 1 ? "s" : ""}`,
				);
			if (parts.length === 0) return null;
			return (
				<box flexDirection="row" justifyContent="center" marginTop={1}>
					<text fg={magic}>{"* "}</text>
					<text fg="gray" content={parts.join(" \u00b7 ")} />
					<text fg={magic}>{" *"}</text>
				</box>
			);
		}
	}
}

export type { AvatarVariant };
