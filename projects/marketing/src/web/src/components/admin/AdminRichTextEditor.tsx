import {
	Code,
	Hamburger,
	Image as ImageIcon,
	LinkBreak,
	Link as LinkIcon,
	List,
	ListNumbers,
	Quotes,
	TextB,
	TextItalic,
	TextStrikethrough,
} from "@phosphor-icons/react";
import { EditorContent, type Editor, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import PlaceholderExtension from "@tiptap/extension-placeholder";
import { useEffect, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";

// ---- toolbar primitives ----

function ToolbarGroup({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-0.5 [&:not(:first-child)]:ml-1 [&:not(:first-child)]:pl-1.5 [&:not(:first-child)]:border-l [&:not(:first-child)]:border-kumo-hairline">
			{children}
		</div>
	);
}

function ToolbarBtn({
	active,
	label,
	children,
	onMouseDown,
}: {
	active?: boolean;
	label: string;
	children: React.ReactNode;
	onMouseDown: (e: React.MouseEvent) => void;
}) {
	return (
		<button
			type="button"
			onMouseDown={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onMouseDown(e);
			}}
			aria-label={label}
			title={label}
			className={cn(
				"inline-flex size-7 items-center justify-center rounded-md transition-colors",
				active
					? "bg-kumo-brand/10 text-kumo-brand"
					: "text-kumo-subtle hover:bg-kumo-fill-hover hover:text-kumo-strong",
			)}
		>
			{children}
		</button>
	);
}

function BubbleBtn({
	active,
	label,
	children,
	onMouseDown,
}: {
	active?: boolean;
	label: string;
	children: React.ReactNode;
	onMouseDown: (e: React.MouseEvent) => void;
}) {
	return (
		<button
			type="button"
			onMouseDown={(e) => {
				e.preventDefault();
				e.stopPropagation();
				onMouseDown(e);
			}}
			aria-label={label}
			title={label}
			className={cn(
				"inline-flex size-6 items-center justify-center rounded text-xs transition-colors",
				active
					? "bg-kumo-brand/10 text-kumo-brand"
					: "text-kumo-subtle hover:bg-kumo-fill-hover hover:text-kumo-strong",
			)}
		>
			{children}
		</button>
	);
}

// ---- helpers ----

const HEADINGS = [
	{ level: 1, label: "H1" },
	{ level: 2, label: "H2" },
	{ level: 3, label: "H3" },
] as const;

function headingLevel(editor: Editor): number {
	if (editor.isActive("heading", { level: 1 })) return 1;
	if (editor.isActive("heading", { level: 2 })) return 2;
	if (editor.isActive("heading", { level: 3 })) return 3;
	return 0;
}

function setLink(editor: Editor) {
	const prev = editor.getAttributes("link").href as string | undefined;
	const url = window.prompt("Link URL", prev ?? "https://");
	if (url === null) return;
	if (url === "") {
		editor.chain().focus().extendMarkRange("link").unsetLink().run();
		return;
	}
	editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
}

function insertImage(editor: Editor) {
	const url = window.prompt("Image URL");
	if (!url) return;
	editor.chain().focus().setImage({ src: url }).run();
}

// ---- main ----

export function AdminRichTextEditor({
	value,
	onChange,
	placeholder = "Write your post...",
	className,
}: {
	value: string;
	onChange: (html: string) => void;
	placeholder?: string;
	className?: string;
}) {
	const onChangeRef = useRef(onChange);
	onChangeRef.current = onChange;
	const skipSync = useRef(false);

	const extensions = useMemo(
		() => [
			StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
			LinkExtension.configure({
				openOnClick: false,
				HTMLAttributes: { rel: "noopener noreferrer", class: "text-kumo-brand underline" },
			}),
			ImageExtension.configure({ HTMLAttributes: { class: "max-w-full rounded-lg" } }),
			PlaceholderExtension.configure({ placeholder }),
		],
		[placeholder],
	);

	const editor = useEditor(
		{
			extensions,
			content: value,
			immediatelyRender: false,
			shouldRerenderOnTransaction: false,
			editorProps: {
				attributes: {
					class:
						"tiptap-content select-text min-h-[20rem] px-5 py-4 focus:outline-none",
					spellcheck: "true",
				},
			},
			onUpdate: ({ editor: currentEditor }) => {
				skipSync.current = true;
				onChangeRef.current(currentEditor.getHTML());
			},
		},
		[],
	);

	useEffect(() => {
		if (!editor || editor.isDestroyed) return;
		if (skipSync.current) {
			skipSync.current = false;
			return;
		}
		const current = editor.getHTML();
		if (value !== current) {
			editor.commands.setContent(value, { emitUpdate: false });
		}
	}, [editor, value]);

	if (!editor) {
		return (
			<div className={cn("min-h-[24rem] rounded-xl border border-kumo-hairline bg-kumo-canvas", className)}>
				<div className="flex items-center gap-3 px-5 py-16 text-sm text-kumo-subtle">
					<div className="size-4 animate-spin rounded-full border-2 border-kumo-hairline border-t-kumo-brand" />
					Loading editor...
				</div>
			</div>
		);
	}

	const level = headingLevel(editor);
	const text = editor.getText();
	const chars = text.length;
	const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

	return (
		<div
			className={cn(
				"flex flex-col overflow-hidden rounded-xl border border-kumo-hairline bg-kumo-canvas",
				className,
			)}
		>
			{/* toolbar */}
			<div className="flex flex-wrap items-center border-b border-kumo-hairline bg-kumo-elevated/70 px-2 py-1.5">
				<select
					value={level}
					onChange={(e) => {
						const lvl = Number(e.target.value);
						if (lvl === 0) editor.chain().focus().setParagraph().run();
						else editor.chain().focus().toggleHeading({ level: lvl as 1 | 2 | 3 }).run();
					}}
					className="mr-1 h-7 w-14 cursor-pointer rounded-md border border-kumo-hairline bg-kumo-canvas px-1.5 text-center text-xs font-medium text-kumo-subtle hover:border-kumo-brand/40 focus:outline-none focus:ring-1 focus:ring-kumo-brand/20"
				>
					<option value={0}>¶</option>
					{HEADINGS.map((h) => (
						<option key={h.level} value={h.level}>
							{h.label}
						</option>
					))}
				</select>

				<ToolbarGroup>
					<ToolbarBtn
						active={editor.isActive("bold")}
						label="Bold"
						onMouseDown={() => editor.chain().focus().toggleBold().run()}
					>
						<TextB size={15} />
					</ToolbarBtn>
					<ToolbarBtn
						active={editor.isActive("italic")}
						label="Italic"
						onMouseDown={() => editor.chain().focus().toggleItalic().run()}
					>
						<TextItalic size={15} />
					</ToolbarBtn>
					<ToolbarBtn
						active={editor.isActive("strike")}
						label="Strike"
						onMouseDown={() => editor.chain().focus().toggleStrike().run()}
					>
						<TextStrikethrough size={15} />
					</ToolbarBtn>
					<ToolbarBtn
						active={editor.isActive("code")}
						label="Code"
						onMouseDown={() => editor.chain().focus().toggleCode().run()}
					>
						<Code size={15} />
					</ToolbarBtn>
				</ToolbarGroup>

				<ToolbarGroup>
					<ToolbarBtn
						active={editor.isActive("link")}
						label="Link"
						onMouseDown={() => setLink(editor)}
					>
						<LinkIcon size={15} />
					</ToolbarBtn>
					<ToolbarBtn label="Unlink" onMouseDown={() => editor.chain().focus().unsetLink().run()}>
						<LinkBreak size={15} />
					</ToolbarBtn>
					<ToolbarBtn label="Image" onMouseDown={() => insertImage(editor)}>
						<ImageIcon size={15} />
					</ToolbarBtn>
				</ToolbarGroup>

				<ToolbarGroup>
					<ToolbarBtn
						active={editor.isActive("bulletList")}
						label="Bullet list"
						onMouseDown={() => editor.chain().focus().toggleBulletList().run()}
					>
						<List size={15} />
					</ToolbarBtn>
					<ToolbarBtn
						active={editor.isActive("orderedList")}
						label="Ordered list"
						onMouseDown={() => editor.chain().focus().toggleOrderedList().run()}
					>
						<ListNumbers size={15} />
					</ToolbarBtn>
					<ToolbarBtn
						active={editor.isActive("blockquote")}
						label="Quote"
						onMouseDown={() => editor.chain().focus().toggleBlockquote().run()}
					>
						<Quotes size={15} />
					</ToolbarBtn>
					<ToolbarBtn
						active={editor.isActive("codeBlock")}
						label="Code block"
						onMouseDown={() => editor.chain().focus().toggleCodeBlock().run()}
					>
						<Hamburger size={15} />
					</ToolbarBtn>
				</ToolbarGroup>

				<div className="ml-auto select-none text-[0.65rem] tabular-nums text-kumo-inactive">
					{chars.toLocaleString()} char
					<span className="ml-1.5 opacity-60">{words.toLocaleString()} words</span>
				</div>
			</div>

			{/* bubble menu */}
			<BubbleMenu
				editor={editor}
				shouldShow={({ editor: currentEditor }) => {
					if (currentEditor.isActive("image")) return false;
					return !currentEditor.view.state.selection.empty;
				}}
				className="flex items-center gap-0.5 rounded-lg border border-kumo-hairline bg-kumo-canvas px-1 py-1 shadow-lg z-50"
			>
				<BubbleBtn
					active={editor.isActive("bold")}
					label="Bold"
					onMouseDown={() => editor.chain().focus().toggleBold().run()}
				>
					<TextB size={14} />
				</BubbleBtn>
				<BubbleBtn
					active={editor.isActive("italic")}
					label="Italic"
					onMouseDown={() => editor.chain().focus().toggleItalic().run()}
				>
					<TextItalic size={14} />
				</BubbleBtn>
				<BubbleBtn
					active={editor.isActive("strike")}
					label="Strike"
					onMouseDown={() => editor.chain().focus().toggleStrike().run()}
				>
					<TextStrikethrough size={14} />
				</BubbleBtn>
				<div className="mx-0.5 h-4 w-px bg-kumo-border" />
				<BubbleBtn
					active={editor.isActive("link")}
					label="Link"
					onMouseDown={() => setLink(editor)}
				>
					<LinkIcon size={14} />
				</BubbleBtn>
			</BubbleMenu>

			<EditorContent editor={editor} />
		</div>
	);
}
