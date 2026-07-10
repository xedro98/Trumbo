// @jsxImportSource @opentui/react
import type { ChoiceContext } from "@opentui-ui/dialog";
import { useDialogKeyboard } from "@opentui-ui/dialog/react";
import { useMemo, useRef, useState } from "react";
import { palette } from "../../palette";
import type { TreePickerItem } from "./tree-picker-utils";

export type { TreePickerItem } from "./tree-picker-utils";

export interface TreePickerResult {
	entryId: string;
	role: "user" | "assistant";
	content: string;
}

export type TreeFilterMode =
	| "default"
	| "no-tools"
	| "user-only"
	| "labeled-only"
	| "all";

const FILTER_MODE_LABELS: Record<TreeFilterMode, string> = {
	default: "Default",
	"no-tools": "No Tools",
	"user-only": "User Only",
	"labeled-only": "Labeled Only",
	all: "All",
};

const FILTER_MODE_ORDER: TreeFilterMode[] = [
	"default",
	"no-tools",
	"user-only",
	"labeled-only",
	"all",
];

const MAX_VISIBLE = 12;

function truncate(text: string, maxLen: number): string {
	if (text.length <= maxLen) return text;
	return `${text.slice(0, maxLen - 1)}…`;
}

function filterItems(
	items: TreePickerItem[],
	mode: TreeFilterMode,
): TreePickerItem[] {
	switch (mode) {
		case "default":
			return items;
		case "no-tools":
			return items.filter(
				(item) => !item.content.includes("[") || item.role === "user",
			);
		case "user-only":
			return items.filter((item) => item.role === "user");
		case "labeled-only":
			return items.filter((item) => item.label !== undefined);
		case "all":
			return items;
		default:
			return items;
	}
}

export function TreePickerContent(
	props: ChoiceContext<TreePickerResult> & {
		items: TreePickerItem[];
	},
) {
	const { resolve, dismiss, dialogId, items } = props;
	const [filterMode, setFilterMode] = useState<TreeFilterMode>("default");
	const filterModeRef = useRef(filterMode);
	filterModeRef.current = filterMode;

	const filtered = useMemo(
		() => filterItems(items, filterMode),
		[items, filterMode],
	);

	const lastIndex = Math.max(0, filtered.length - 1);
	const [selected, setSelected] = useState(lastIndex);
	const selectedRef = useRef(lastIndex);

	const safeSelected = Math.min(selected, Math.max(0, filtered.length - 1));
	selectedRef.current = safeSelected;

	const window = useMemo(() => {
		if (filtered.length <= MAX_VISIBLE) {
			return { visible: filtered, startIndex: 0 };
		}
		const half = Math.floor(MAX_VISIBLE / 2);
		let start = Math.max(0, safeSelected - half);
		const end = Math.min(filtered.length, start + MAX_VISIBLE);
		if (end - start < MAX_VISIBLE) start = Math.max(0, end - MAX_VISIBLE);
		return {
			visible: filtered.slice(start, end),
			startIndex: start,
		};
	}, [filtered, safeSelected]);

	const aboveCount = window.startIndex;
	const belowCount = Math.max(
		0,
		filtered.length - (window.startIndex + window.visible.length),
	);

	useDialogKeyboard((key) => {
		if (key.name === "escape") {
			dismiss();
			return;
		}
		if (key.name === "return" || key.name === "enter") {
			const item = filtered[selectedRef.current];
			if (item) {
				resolve({
					entryId: item.id,
					role: item.role,
					content: item.content,
				});
			}
			return;
		}
		if (key.ctrl && key.name === "o") {
			const currentIdx = FILTER_MODE_ORDER.indexOf(filterModeRef.current);
			const nextIdx = (currentIdx + 1) % FILTER_MODE_ORDER.length;
			setFilterMode(FILTER_MODE_ORDER[nextIdx]);
			setSelected(Math.max(0, lastIndex));
			return;
		}
		if (key.name === "up" || (key.ctrl && key.name === "p")) {
			setSelected((s) => {
				const next = s <= 0 ? lastIndex : s - 1;
				selectedRef.current = next;
				return next;
			});
			return;
		}
		if (key.name === "down" || (key.ctrl && key.name === "n")) {
			setSelected((s) => {
				const next = s >= lastIndex ? 0 : s + 1;
				selectedRef.current = next;
				return next;
			});
			return;
		}
	}, dialogId);

	if (filtered.length === 0) {
		return (
			<box flexDirection="column" paddingX={1}>
				<text fg="gray">No messages in this session.</text>
				<text fg="gray" marginTop={1}>
					<em>Esc to close</em>
				</text>
			</box>
		);
	}

	return (
		<box flexDirection="column" paddingX={1}>
			{aboveCount > 0 && <text fg="gray">{`▲ ${aboveCount} more above`}</text>}
			{window.visible.map((item, i) => {
				const absIdx = window.startIndex + i;
				const isSel = absIdx === safeSelected;
				const indent = "  ".repeat(item.depth);
				const marker = item.isActiveLeaf ? " ●" : item.isBranch ? " ◆" : " ";
				const roleIcon = item.role === "user" ? "▶" : "·";
				const pathMarker = item.isOnActivePath ? "│" : " ";
				const text = truncate(item.content, 50 - item.depth * 2);
				const fg = isSel
					? palette.textOnSelection
					: item.isActiveLeaf
						? palette.brand
						: item.isOnActivePath
							? undefined
							: "gray";

				return (
					<box
						key={item.id}
						paddingX={0}
						flexDirection="row"
						gap={0}
						backgroundColor={isSel ? palette.selection : undefined}
						overflow="hidden"
						height={1}
					>
						<text fg={isSel ? palette.textOnSelection : "gray"} flexShrink={0}>
							{isSel ? "❯" : " "}
						</text>
						<text fg={isSel ? palette.textOnSelection : "gray"} flexShrink={0}>
							{pathMarker}
						</text>
						<text fg={fg} flexShrink={0}>
							{indent}
						</text>
						<text fg={fg} flexShrink={0}>
							{roleIcon}
						</text>
						<text fg={fg} flexShrink={0}>
							{marker}
						</text>
						<text fg={fg}>{text}</text>
					</box>
				);
			})}
			{belowCount > 0 && <text fg="gray">{`▼ ${belowCount} more below`}</text>}
			<text fg="gray" marginTop={1}>
				<em>
					{`↑/↓ navigate, Enter select, Ctrl+O filter (${FILTER_MODE_LABELS[filterMode]}), Esc cancel`}
				</em>
			</text>
		</box>
	);
}

export { buildTreePickerItems } from "./tree-picker-utils";
