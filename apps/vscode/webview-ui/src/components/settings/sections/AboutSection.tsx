import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import Section from "../Section"

interface AboutSectionProps {
	version: string
	renderSectionHeader: (tabId: string) => JSX.Element | null
}

const REPO = "https://github.com/xedro98/trembo"

// 7-line figlet-style TREMBO banner. Backslashes are preserved verbatim via
// String.raw so the ASCII art renders exactly as authored.
const TREMBO_LOGO = String.raw`
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
	.map((line) => line.trimEnd())
	.join("\n")

const AboutSection = ({ version, renderSectionHeader }: AboutSectionProps) => {
	return (
		<div>
			{renderSectionHeader("about")}
			<Section>
				<div className="flex px-4 flex-col gap-2">
					<pre
						className="text-[10px] leading-[1.1] m-0 whitespace-pre font-mono"
						style={{ color: "var(--vscode-textLink-color, #22c55e)" }}>
						{TREMBO_LOGO}
					</pre>
					<h2 className="text-lg font-semibold">Trembo v{version}</h2>
					<p>
						An AI assistant that can use your CLI and Editor. Trembo can handle complex software development tasks
						step-by-step with tools that let it create &amp; edit files, explore large projects, use the browser, and
						execute terminal commands (after you grant permission).
					</p>

					<h3 className="text-md font-semibold">Development</h3>
					<p>
						<VSCodeLink href={REPO}>GitHub</VSCodeLink>
						{" • "}
						<VSCodeLink href={`${REPO}/issues`}>Issues</VSCodeLink>
						{" • "}
						<VSCodeLink href={`${REPO}/discussions`}>Discussions</VSCodeLink>
					</p>

					<h3 className="text-md font-semibold">Resources</h3>
					<p>
						<VSCodeLink href={REPO}>Documentation</VSCodeLink>
						{" • "}
						<VSCodeLink href={REPO}>{REPO}</VSCodeLink>
					</p>
				</div>
			</Section>
		</div>
	)
}

export default AboutSection
