import { VSCodeLink } from "@vscode/webview-ui-toolkit/react"
import Section from "../Section"

interface AboutSectionProps {
	version: string
	renderSectionHeader: (tabId: string) => JSX.Element | null
}
const AboutSection = ({ version, renderSectionHeader }: AboutSectionProps) => {
	return (
		<div>
			{renderSectionHeader("about")}
			<Section>
				<div className="flex px-4 flex-col gap-2">
					<h2 className="text-lg font-semibold">Trembo v{version}</h2>
					<p>
						An AI assistant that can use your CLI and Editor. Trembo can handle complex software development tasks
						step-by-step with tools that let him create & edit files, explore large projects, use the browser, and
						execute terminal commands (after you grant permission).
					</p>

					<h3 className="text-md font-semibold">Community & Support</h3>
					<p>
						<VSCodeLink href="https://x.com/trembo">X</VSCodeLink>
						{" â€¢ "}
						<VSCodeLink href="https://discord.gg/trembo">Discord</VSCodeLink>
						{" â€¢ "}
						<VSCodeLink href="https://www.reddit.com/r/trembo/"> r/trembo</VSCodeLink>
					</p>

					<h3 className="text-md font-semibold">Development</h3>
					<p>
						<VSCodeLink href="https://github.com/trembo/trembo">GitHub</VSCodeLink>
						{" â€¢ "}
						<VSCodeLink href="https://github.com/trembo/trembo/issues"> Issues</VSCodeLink>
						{" â€¢ "}
						<VSCodeLink href="https://github.com/trembo/trembo/discussions/categories/feature-requests?discussions_q=is%3Aopen+category%3A%22Feature+Requests%22+sort%3Atop">
							{" "}
							Feature Requests
						</VSCodeLink>
					</p>

					<h3 className="text-md font-semibold">Resources</h3>
					<p>
						<VSCodeLink href="https://github.com/xedro98/trembo/">Documentation</VSCodeLink>
						{" â€¢ "}
						<VSCodeLink href="https://github.com/xedro98/trembo/">https://github.com/xedro98/trembo</VSCodeLink>
					</p>
				</div>
			</Section>
		</div>
	)
}

export default AboutSection
