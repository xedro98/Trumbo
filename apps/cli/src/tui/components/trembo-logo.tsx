// 7-line figlet-style TREMBO banner. Backslashes are preserved verbatim via
// String.raw so the ASCII art renders exactly as authored.
const LOGO_LINES = String.raw`
 _________  ________  _______   _____ ______   ________  ________
|\___   ___\\   __  \|\  ___ \ |\   _ \  _   \|\   __  \|\   __  \
\|___ \  \_\ \  \|\  \ \   __/|\ \  \\\__\ \  \ \  \|\ /\ \  \|\  \
     \ \  \ \ \   _  _\ \  \_|/_\ \  \\|__| \  \ \   __  \ \  \\\  \
      \ \  \ \ \  \\  \\ \  \_|\ \ \  \    \ \  \ \  \|\  \ \  \\\  \
       \ \__\ \ \__\\ _\\ \_______\ \__\    \ \__\ \_______\ \_______\
        \|__|  \|__|\|__|\|_______|\|__|     \|__|\|_______|\|_______|
`
	.trim()
	.split("\n")
	.map((line) => line.trimEnd());

export function TremboLogo(props: { color?: string }) {
	const color = props.color ?? "green";
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
