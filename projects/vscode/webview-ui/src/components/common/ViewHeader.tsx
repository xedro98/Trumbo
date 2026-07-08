import BrandMark from "@/components/brand/BrandMark"
import { TrumboButton } from "@/components/trumbo"
import { getEnvironmentColor } from "@/utils/environmentColors"
import type { Environment } from "../../../../src/shared/config-types"

const ENV_DISPLAY_NAMES: Record<Environment, string> = {
	production: "Production",
	staging: "Staging",
	local: "Local",
	selfHosted: "Self-hosted",
}

type ViewHeaderProps = {
	title: string
	onDone: () => void
	showEnvironmentSuffix?: boolean
	environment?: Environment
}

/**
 * ViewHeader — the shared branded header for full-screen views (Settings,
 * History, Account, Marketplace, MCP, Worktrees). New T mark + title on the
 * left, a secondary Done button on the right, on a hairline brand edge.
 */
const ViewHeader = ({ title, onDone, showEnvironmentSuffix, environment }: ViewHeaderProps) => {
	const showSubtext = showEnvironmentSuffix && environment && environment !== "production"
	const capitalizedEnv = environment ? ENV_DISPLAY_NAMES[environment] : ""
	const titleColor = getEnvironmentColor(environment)

	return (
		<div className="trumbo-edge-top flex items-center justify-between px-4 py-3">
			<div className="flex items-center gap-2.5">
				<BrandMark environment={environment} className="size-5 shrink-0" />
				<div className="relative">
					<h3
						className="m-0 font-heading text-base font-semibold tracking-[-0.018em]"
						style={{ color: titleColor }}>
						{title}
					</h3>
					{showSubtext && (
						<span className="absolute left-0 top-[18px] -translate-y-1 whitespace-nowrap text-[11px] text-[color:var(--vscode-descriptionForeground)]">
							{capitalizedEnv} environment
						</span>
					)}
				</div>
			</div>
			<TrumboButton variant="secondary" size="sm" onClick={onDone}>
				Done
			</TrumboButton>
		</div>
	)
}

export default ViewHeader
