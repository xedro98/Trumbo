import "opentui-spinner/react";

// Role avatars for the redesigned chat surface.
//
// Each message row leads with a fixed-width avatar column: a colored glyph
// that identifies the speaker (user vs assistant vs tool vs system). The
// assistant avatar swaps to a spinner while streaming so the "magical" spark
// animates while the model thinks. A `glyph` override lets tool calls pick a
// per-tool icon without changing the role color.

export type AvatarVariant =
	| "assistant"
	| "user"
	| "tool"
	| "reasoning"
	| "system"
	| "error";

// Windows-safe avatar glyphs.
//
// We avoid Dingbats (U+2700–U+27BF) and rare symbols (⚙ ⌕) because Cascadia
// Mono / Consolas don't ship them, so they render as blank or broken boxes.
// Instead we use ASCII (`*`, letters) and Geometric Shapes (U+25A0–U+25FF)
// which both default Windows terminal fonts cover. Color + the streaming
// spinner carry the "magical" feel; the glyphs just need to be visible.

const ROLE_GLYPH: Record<AvatarVariant, string> = {
	assistant: "*", // star/sparkle (ASCII, always renders)
	user: "\u25cf", // ● black circle
	tool: "#", // hash = tool/action
	reasoning: "~", // wavy "thinking" squiggle
	system: "\u00b7", // · middle dot
	error: "x", // ASCII x
};

export interface AvatarProps {
	variant: AvatarVariant;
	color: string;
	streaming?: boolean;
	/** Override the default role glyph (used by per-tool icons). */
	glyph?: string;
}

export function Avatar(props: AvatarProps) {
	const { variant, color, streaming, glyph } = props;
	return (
		<box width={2} flexShrink={0}>
			{streaming ? (
				<spinner name="dots" color={color} />
			) : (
				<text fg={color}>{glyph ?? ROLE_GLYPH[variant]}</text>
			)}
		</box>
	);
}

// Per-tool icons use ASCII letters/symbols so they never break on Windows
// fonts. The role color still ties them to the tool family visually.
export function toolGlyph(name: string): string {
	switch (name) {
		case "read_files":
			return "R";
		case "run_commands":
		case "bash":
			return ">";
		case "editor":
		case "edit":
		case "write":
			return "E";
		case "apply_patch":
			return "P";
		case "search_codebase":
			return "S";
		case "fetch_web_content":
			return "W";
		case "spawn_agent":
			return "A";
		case "skills":
			return "K";
		case "ask_question":
		case "ask_followup_question":
			return "?";
		case "switch_to_act_mode":
			return "~";
		default:
			return "#";
	}
}
