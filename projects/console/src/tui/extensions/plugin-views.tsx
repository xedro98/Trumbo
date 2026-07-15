import type { TuiViewContribution } from "@trumbodev/shared";
import type React from "react";

/**
 * Interpret a `TuiViewContribution`'s serializable render descriptor and
 * return React elements. The descriptor is a plain JSON object so it works
 * across the subprocess-sandbox boundary. Supported kinds:
 * - `{ kind: "text", content: "...", fg?: "..." }` → a styled text line
 * - `{ kind: "status", label: "...", value: "...", fg?: "..." }` → a label: value row
 * - Unknown kinds are ignored (forward-compatible).
 */
export function renderPluginView(
	view: TuiViewContribution,
): React.ReactNode | null {
	const render = view.render;
	if (!render || typeof render !== "object") return null;
	const kind = (render as { kind?: string }).kind;
	const fg = (render as { fg?: string }).fg;
	const content = (render as { content?: string }).content;

	if (kind === "text" && typeof content === "string") {
		return <text fg={fg ?? "gray"}>{content}</text>;
	}

	if (kind === "status") {
		const label = (render as { label?: string }).label;
		const value = (render as { value?: string }).value;
		if (typeof label === "string" && typeof value === "string") {
			return (
				<text fg={fg ?? "gray"}>
					<span fg={fg ?? "gray"}>{label}: </span>
					<span fg="white">{value}</span>
				</text>
			);
		}
	}

	return null;
}

/**
 * Render all contributed footer views (slot: "footer") as a column of
 * interpreted elements. Returns null if no footer views are registered.
 */
export function PluginFooterViews(props: {
	views?: TuiViewContribution[];
}): React.ReactNode | null {
	if (!props.views || props.views.length === 0) return null;
	const footerViews = props.views.filter((v) => v.slot === "footer");
	if (footerViews.length === 0) return null;
	return (
		<box flexDirection="column" paddingX={1}>
			{footerViews.map((view) => (
				<box key={view.id}>{renderPluginView(view)}</box>
			))}
		</box>
	);
}
