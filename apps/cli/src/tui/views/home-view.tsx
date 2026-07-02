import { useTerminalDimensions } from "@opentui/react";
import {
	AutocompleteDropdown,
	type AutocompleteDropdownProps,
	DROPDOWN_MAX_HEIGHT,
} from "../components/autocomplete-dropdown";
import { InputBar, type TextareaHandle } from "../components/input-bar";
import {
	resolveModelDisplayName,
	resolveModelMaxInputTokens,
	StatusBar,
} from "../components/status-bar";
import { useSession } from "../contexts/session-context";
import {
	useTerminalBackground,
	useTerminalTheme,
} from "../hooks/use-terminal-background";
import {
	getDefaultForeground,
	getModeAccent,
	getModeInputBackground,
	getModeInputForeground,
	getModeInputPlaceholder,
} from "../palette";
import { HOME_VIEW_MAX_WIDTH, type TuiProps } from "../types";

export function HomeView(props: {
	config: TuiProps["config"];
	inputValue: string;
	inputKey: number;
	onSubmit: () => void;
	onContentChange: (text: string) => void;
	onImagePaste: (dataUrl: string) => string;
	onLargeTextPaste: (text: string) => string;
	onInputFocusRequest?: () => void;
	repoStatus: {
		branch: string | null;
		diffStats: {
			files: number;
			additions: number;
			deletions: number;
		} | null;
	};
	textareaRef?: React.MutableRefObject<TextareaHandle | null>;
	autocomplete?: AutocompleteDropdownProps;
	onToggleMode: () => void;
}) {
	const {
		config,
		inputValue,
		inputKey,
		onSubmit,
		onContentChange,
		onImagePaste,
		onLargeTextPaste,
		repoStatus,
	} = props;
	const session = useSession();
	const { width } = useTerminalDimensions();

	const terminalBg = useTerminalBackground();
	const terminalTheme = useTerminalTheme();
	const defaultFg = getDefaultForeground(terminalBg);
	const accent = getModeAccent(session.uiMode, terminalTheme);
	const inputBackground = getModeInputBackground(session.uiMode, terminalBg);
	const inputForeground = getModeInputForeground(session.uiMode, terminalBg);
	const inputPlaceholder = getModeInputPlaceholder(session.uiMode, terminalBg);
	const placeholder =
		session.uiMode === "plan" ? "Plan something..." : "Ask anything...";
	const modelDisplayName = resolveModelDisplayName(config);
	const maxInputTokens = resolveModelMaxInputTokens(config);
	const hasAutocomplete =
		props.autocomplete?.mode && props.autocomplete.options.length > 0;
	const contentWidth = Math.min(width, HOME_VIEW_MAX_WIDTH);

	return (
		<box
			flexDirection="column"
			width="100%"
			height="100%"
			alignItems="center"
			justifyContent="center"
		>
			<box marginTop={1} marginBottom={1} flexShrink={0}>
				<text fg={accent}>
					<strong>{"T R E M B O"}</strong>
				</text>
			</box>
			<box marginBottom={1} flexShrink={0}>
				<text fg={defaultFg}>
					<strong>How can I help you today?</strong>
				</text>
			</box>
			<box marginBottom={1} flexShrink={0}>
				<text fg="gray">
					<em>
						Type / for commands, @ to mention files, Ctrl+P for palette
					</em>
				</text>
			</box>

			<box flexDirection="column" width={contentWidth} flexShrink={0}>
				<InputBar
					accent={accent}
					inputBackground={inputBackground}
					inputForeground={inputForeground}
					inputPlaceholder={inputPlaceholder}
					placeholder={placeholder}
					initialValue={inputValue}
					inputKey={inputKey}
					onSubmit={onSubmit}
					onContentChange={onContentChange}
					onImagePaste={onImagePaste}
					onLargeTextPaste={onLargeTextPaste}
					onFocusRequest={props.onInputFocusRequest}
					textareaRef={props.textareaRef}
				/>

				<box flexDirection="column" height={DROPDOWN_MAX_HEIGHT + 1}>
					{hasAutocomplete && props.autocomplete ? (
						<AutocompleteDropdown
							{...props.autocomplete}
							accent={accent}
							containerWidth={Math.min(width, HOME_VIEW_MAX_WIDTH)}
						/>
					) : (
						<box marginTop={1}>
							<StatusBar
								providerId={config.providerId}
								modelId={modelDisplayName}
								totalTokens={session.lastTotalTokens}
								totalCost={session.lastTotalCost}
								maxInputTokens={maxInputTokens}
								uiMode={session.uiMode}
								autoApproveAll={session.autoApproveAll}
								workspaceName={
									config.workspaceRoot
										? (config.workspaceRoot.split("/").pop() ?? "")
										: ""
								}
								gitBranch={repoStatus.branch}
								gitDiffStats={repoStatus.diffStats}
								onToggleMode={props.onToggleMode}
								variant="home"
							/>
						</box>
					)}
				</box>
			</box>
		</box>
	);
}
