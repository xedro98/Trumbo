// 6-line ANSI Shadow TRUMBO banner. The block glyphs are preserved verbatim via
// String.raw so the art renders exactly as authored.
import { palette } from "../palette";

const LOGO_LINES = String.raw`
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
`
	.trim()
	.split("\n")
	.map((line) => line.trimEnd());

export function TrumboLogo(props: { color?: string }) {
	const color = props.color ?? palette.brand;
	return (
		<box flexDirection="column" alignItems="center">
			{LOGO_LINES.map((line, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static, fixed-order logo lines
				<text key={`logo-${i}`} fg={color}>
					{line}
				</text>
			))}
		</box>
	);
}
