import { useTerminalDimensions } from "@opentui/react";
import { useMemo } from "react";
import logoRaw from "../assets/trumbo-logo.txt";
import { TRUMBO_LOGO_DISPLAY_SCALE } from "../logo-config";
import { palette } from "../palette";
import {
	parseAsciiLogo,
	resolveLogoBounds,
	scaleAsciiLogo,
} from "../utils/scale-ascii-logo";

const SOURCE_LINES = parseAsciiLogo(logoRaw);

export function TrumboLogo(props: { color?: string; reservedHeight?: number }) {
	const { width, height } = useTerminalDimensions();
	const color = props.color ?? palette.brand;

	const logoText = useMemo(() => {
		const { maxWidth, maxHeight } = resolveLogoBounds({
			terminalWidth: width,
			terminalHeight: height,
			reservedHeight: props.reservedHeight,
		});
		return scaleAsciiLogo(
			SOURCE_LINES,
			maxWidth,
			maxHeight,
			TRUMBO_LOGO_DISPLAY_SCALE,
		);
	}, [height, props.reservedHeight, width]);

	if (!logoText) {
		return null;
	}

	return (
		<box width="100%" flexDirection="column" alignItems="center">
			<text fg={color}>{logoText}</text>
		</box>
	);
}
