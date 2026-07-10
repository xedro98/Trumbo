import type React from "react";

// A vertical accent rail: a 1-cell colored stripe on the left that stretches
// to the full height of the message body next to it. This replaces per-side
// borders (not typed in this OpenTUI React revision) and gives every message
// a consistent "card with a colored edge" feel. An optional background tint
// turns it into a chat bubble (used for user messages).
export function AccentRail(props: {
	color: string;
	backgroundColor?: string;
	children: React.ReactNode;
}) {
	const { color, backgroundColor, children } = props;
	return (
		<box flexGrow={1} flexDirection="row">
			<box width={1} flexShrink={0} backgroundColor={color} />
			<box
				flexGrow={1}
				flexDirection="column"
				paddingLeft={1}
				backgroundColor={backgroundColor}
			>
				{children}
			</box>
		</box>
	);
}
