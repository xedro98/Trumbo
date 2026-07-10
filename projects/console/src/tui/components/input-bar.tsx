import {
	decodePasteBytes,
	type KeyEvent,
	type PasteEvent,
	stripAnsiSequences,
	type TextareaRenderable,
} from "@opentui/core";
import { useCallback, useRef } from "react";
import {
	readClipboardImageDataUrl,
	readImagePasteAttachment,
	readImmediateImagePasteAttachment,
} from "../utils/image-paste";
import { KillRing } from "../utils/kill-ring";
import { shouldCompactPastedText } from "../utils/pasted-snippets";
import { shouldBlockTerminalInputKey } from "../utils/sanitize-terminal-input";

export type TextareaHandle = Pick<
	TextareaRenderable,
	| "plainText"
	| "onSubmit"
	| "focus"
	| "setText"
	| "insertText"
	| "cursorOffset"
	| "visualCursor"
	| "height"
	| "virtualLineCount"
	| "extmarks"
	| "getSelection"
>;

export interface InputBarProps {
	accent: string;
	inputBackground: string;
	inputForeground: string;
	inputPlaceholder: string;
	placeholder: string;
	initialValue: string;
	inputKey: number;
	onSubmit: () => void;
	onContentChange: (text: string) => void;
	onImagePaste?: (dataUrl: string) => string;
	onLargeTextPaste?: (text: string) => string;
	onVisualCursorChange?: (cursor: {
		visualCol: number;
		visualRow: number;
	}) => void;
	onFocusRequest?: () => void;
	textareaRef?: React.MutableRefObject<TextareaHandle | null>;
}

function readTextPaste(event: PasteEvent): string | null {
	if (
		event.metadata?.kind === "binary" ||
		event.metadata?.mimeType?.startsWith("image/")
	) {
		return null;
	}

	return stripAnsiSequences(decodePasteBytes(event.bytes));
}

export function InputBar(props: InputBarProps) {
	const {
		accent,
		inputBackground,
		inputForeground,
		inputPlaceholder,
		placeholder,
		initialValue,
		inputKey,
		onSubmit,
		onContentChange,
	} = props;
	const localRef = useRef<TextareaHandle | null>(null);
	const inputRef = props.textareaRef ?? localRef;

	const onSubmitRef = useRef(onSubmit);
	onSubmitRef.current = onSubmit;
	const onContentChangeRef = useRef(onContentChange);
	onContentChangeRef.current = onContentChange;
	const onImagePasteRef = useRef(props.onImagePaste);
	onImagePasteRef.current = props.onImagePaste;
	const onLargeTextPasteRef = useRef(props.onLargeTextPaste);
	onLargeTextPasteRef.current = props.onLargeTextPaste;
	const onVisualCursorChangeRef = useRef(props.onVisualCursorChange);
	onVisualCursorChangeRef.current = props.onVisualCursorChange;

	const emitVisualCursorChange = useCallback(() => {
		const cursor = inputRef.current?.visualCursor;
		if (!cursor) return;
		onVisualCursorChangeRef.current?.({
			visualCol: cursor.visualCol,
			visualRow: cursor.visualRow,
		});
	}, [inputRef]);

	const textareaRefCallback = useCallback(
		(node: unknown) => {
			const ta = node as TextareaHandle | null;
			inputRef.current = ta;
			if (ta) {
				ta.onSubmit = () => {
					onSubmitRef.current();
				};
				emitVisualCursorChange();
			}
		},
		[emitVisualCursorChange, inputRef],
	);

	const insertImageAttachment = useCallback(
		(dataUrl: string) => {
			const marker = onImagePasteRef.current?.(dataUrl);
			if (!marker) return;
			inputRef.current?.insertText(`${marker} `);
			queueMicrotask(() => {
				const text = inputRef.current?.plainText ?? "";
				onContentChangeRef.current(text);
			});
		},
		[inputRef],
	);

	const insertAtomicText = useCallback(
		(text: string) => {
			const ta = inputRef.current;
			if (!ta) return;

			const selection = ta.getSelection();
			const start = selection
				? Math.min(selection.start, selection.end)
				: ta.cursorOffset;
			ta.insertText(text);
			ta.extmarks.create({
				start,
				end: start + text.length,
				virtual: true,
			});
			queueMicrotask(() => {
				const plainText = inputRef.current?.plainText ?? "";
				onContentChangeRef.current(plainText);
			});
		},
		[inputRef],
	);

	const handlePaste = useCallback(
		(event: PasteEvent) => {
			if (onImagePasteRef.current) {
				const immediate = readImmediateImagePasteAttachment(event);
				if (immediate) {
					event.preventDefault();
					insertImageAttachment(immediate.dataUrl);
					return;
				}
			}

			const pastedText = readTextPaste(event);
			if (
				pastedText &&
				shouldCompactPastedText(pastedText) &&
				onLargeTextPasteRef.current
			) {
				const marker = onLargeTextPasteRef.current(pastedText);
				event.preventDefault();
				insertAtomicText(marker);
				return;
			}

			if (onImagePasteRef.current) {
				void readImagePasteAttachment(event).then((attachment) => {
					if (!attachment) return;
					event.preventDefault();
					insertImageAttachment(attachment.dataUrl);
				});
			}
		},
		[insertAtomicText, insertImageAttachment],
	);

	const killRingRef = useRef(new KillRing());
	const lastKeyWasKillRef = useRef(false);

	const handleKeyDown = useCallback(
		(event: KeyEvent) => {
			if (shouldBlockTerminalInputKey(event)) {
				event.preventDefault();
				return;
			}

			const ta = inputRef.current;
			const ring = killRingRef.current;

			// Kill-ring: Ctrl+K (kill to line end), Ctrl+U (kill to line start).
			// Capture the text before the native delete, push to the ring, then
			// let OpenTUI's native handler do the actual deletion.
			if (event.ctrl && !event.shift && ta) {
				const text = ta.plainText ?? "";
				const cursor = ta.cursorOffset ?? 0;

				if (event.name === "k") {
					const lineEnd = text.indexOf("\n", cursor);
					const end = lineEnd === -1 ? text.length : lineEnd;
					const killed = text.slice(cursor, end);
					if (killed.length > 0) {
						ring.kill(killed, lastKeyWasKillRef.current);
					}
					lastKeyWasKillRef.current = true;
					return; // let native handler delete
				}

				if (event.name === "u") {
					const lineStart = text.lastIndexOf("\n", cursor - 1) + 1;
					const start = lineStart < 0 ? 0 : lineStart;
					const killed = text.slice(start, cursor);
					if (killed.length > 0) {
						ring.kill(killed, lastKeyWasKillRef.current);
					}
					lastKeyWasKillRef.current = true;
					return;
				}
			}

			// Yank: Ctrl+Y inserts the top of the kill ring.
			if (event.ctrl && !event.shift && event.name === "y" && ta) {
				const yanked = ring.yank();
				if (yanked !== undefined) {
					const cursor = ta.cursorOffset ?? 0;
					ta.insertText(yanked);
					ring.recordYankPosition(cursor, cursor + yanked.length);
					event.preventDefault();
				}
				lastKeyWasKillRef.current = false;
				return;
			}

			// Yank-pop: Meta+Y (Alt+Y) rotates the ring and inserts the next entry.
			if (event.meta && !event.ctrl && event.name === "y" && ta) {
				const next = ring.yankPop();
				if (next !== undefined) {
					ta.insertText(next);
					event.preventDefault();
				}
				lastKeyWasKillRef.current = false;
				return;
			}

			// Any other key resets the accumulate behavior.
			lastKeyWasKillRef.current = false;

			if (!event.ctrl || event.name !== "v" || !onImagePasteRef.current) {
				return;
			}

			void readClipboardImageDataUrl().then((dataUrl) => {
				if (!dataUrl) return;
				event.preventDefault();
				insertImageAttachment(dataUrl);
			});
		},
		[insertImageAttachment, inputRef.current],
	);

	const emitContentChange = useCallback(() => {
		const text = inputRef.current?.plainText ?? "";
		onContentChangeRef.current(text);
		emitVisualCursorChange();
	}, [emitVisualCursorChange, inputRef]);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: OpenTUI boxes handle terminal mouse input.
		<box
			flexDirection="row"
			alignItems="center"
			backgroundColor={inputBackground}
			border
			borderStyle="rounded"
			borderColor={accent}
			title="Ask Trumbo"
			titleAlignment="left"
			paddingX={2}
			paddingY={1}
			onMouseDown={props.onFocusRequest}
		>
			<text fg={accent}>
				<strong>{"*"}</strong>
			</text>
			<box flexGrow={1} paddingLeft={1}>
				<textarea
					key={inputKey}
					ref={textareaRefCallback as React.RefCallback<never>}
					initialValue={initialValue}
					onContentChange={() => {
						queueMicrotask(() => {
							emitContentChange();
						});
					}}
					onPaste={handlePaste}
					onKeyDown={(event: KeyEvent) => {
						handleKeyDown(event);
						queueMicrotask(() => {
							emitVisualCursorChange();
						});
					}}
					placeholder={placeholder}
					placeholderColor={inputPlaceholder}
					textColor={inputForeground}
					focusedTextColor={inputForeground}
					focused
					flexGrow={1}
					cursorColor={accent}
					minHeight={1}
					maxHeight={5}
					wrapMode="word"
					keyBindings={[
						{ name: "return", action: "submit" },
						{ name: "return", shift: true, action: "newline" },
						{ name: "return", ctrl: true, action: "newline" },
						{ name: "return", meta: true, action: "newline" },
					]}
				/>
			</box>
		</box>
	);
}
