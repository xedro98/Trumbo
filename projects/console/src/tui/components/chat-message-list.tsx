import "opentui-spinner/react";
import type { ScrollBoxRenderable } from "@opentui/core";
import type { AgentMode, TrumboSubscriptionPlan } from "@trumbo/core";
import {
	forwardRef,
	useCallback,
	useEffect,
	useImperativeHandle,
	useRef,
} from "react";
import type { TranscriptCommand } from "../hooks/transcript-keybinds";
import { useTerminalTheme } from "../hooks/use-terminal-background";
import { getModeAccent, palette } from "../palette";
import type { ChatEntry } from "../types";
import { ChatEntryView } from "./chat-entry";
import { TrumboLogo } from "./trumbo-logo";

export interface TranscriptScrollHandle {
	runTranscriptCommand: (command: TranscriptCommand) => void;
}

interface ChatMessageListProps {
	entries: ChatEntry[];
	isStreaming?: boolean;
	loadIndividualSubscriptionPlans?: () => Promise<TrumboSubscriptionPlan[]>;
	uiMode?: AgentMode;
}

export const ChatMessageList = forwardRef<
	TranscriptScrollHandle,
	ChatMessageListProps
>(function ChatMessageList(props, ref) {
	const scrollboxRef = useRef<ScrollBoxRenderable | null>(null);
	const lastEntry = props.entries.at(-1);
	const terminalTheme = useTerminalTheme();
	const accent = getModeAccent(props.uiMode ?? "act", terminalTheme);
	const userSubmissionScrollKey =
		lastEntry?.kind === "user_submitted" ? props.entries.length : 0;

	const runTranscriptCommand = useCallback((command: TranscriptCommand) => {
		const scrollbox = scrollboxRef.current;
		if (!scrollbox) return;

		switch (command) {
			case "messages_page_up":
				scrollbox.scrollBy(-scrollbox.height / 2);
				return;
			case "messages_page_down":
				scrollbox.scrollBy(scrollbox.height / 2);
				return;
			case "messages_half_page_up":
				scrollbox.scrollBy(-scrollbox.height / 4);
				return;
			case "messages_half_page_down":
				scrollbox.scrollBy(scrollbox.height / 4);
				return;
			case "messages_first":
				scrollbox.scrollTo(0);
				return;
			case "messages_last":
				scrollbox.scrollTo(scrollbox.scrollHeight);
				return;
		}
	}, []);

	useImperativeHandle(
		ref,
		() => ({
			runTranscriptCommand,
		}),
		[runTranscriptCommand],
	);

	useEffect(() => {
		if (!userSubmissionScrollKey) return;

		const scrollToBottom = () => {
			const scrollbox = scrollboxRef.current;
			if (!scrollbox) return;

			scrollbox.scrollTo(scrollbox.scrollHeight);
		};

		scrollToBottom();
		queueMicrotask(scrollToBottom);
		const timeout = setTimeout(scrollToBottom, 0);
		return () => clearTimeout(timeout);
	}, [userSubmissionScrollKey]);

	// Branded empty state: before the first message, show the Trumbo ASCII logo
	// centered in the chat area instead of an empty scrollbox. The logo makes
	// way for the transcript as soon as a message arrives.
	const isEmpty = props.entries.length === 0 && !props.isStreaming;
	if (isEmpty) {
		return (
			<box
				flexGrow={1}
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
			>
				<box marginBottom={1} flexShrink={0}>
					<TrumboLogo color={accent} reservedHeight={18} />
				</box>
				<text fg={palette.muted}>
					<em>Message Trumbo to get started</em>
				</text>
			</box>
		);
	}

	return (
		<scrollbox
			ref={scrollboxRef}
			flexGrow={1}
			stickyScroll
			stickyStart="bottom"
		>
			<box
				flexDirection="column"
				paddingX={1}
				paddingTop={1}
				paddingBottom={1}
				gap={1}
			>
				{props.entries.map((entry, i) => {
					const key = `${i}:${entry.kind}`;
					return (
						<ChatEntryView
							key={key}
							entry={entry}
							accent={accent}
							loadIndividualSubscriptionPlans={
								props.loadIndividualSubscriptionPlans
							}
							terminalTheme={terminalTheme}
						/>
					);
				})}
				{props.isStreaming && (
					<box flexDirection="row" gap={1} marginLeft={2}>
						<spinner name="dots" color={accent} />
						<text fg="gray">
							<em>Thinking... (esc to cancel)</em>
						</text>
					</box>
				)}
			</box>
		</scrollbox>
	);
});
