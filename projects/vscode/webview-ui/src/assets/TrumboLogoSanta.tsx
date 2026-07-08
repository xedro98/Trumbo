import { SVGProps } from "react"
import type { Environment } from "../../../src/shared/config-types"
import { getEnvironmentColor } from "../utils/environmentColors"

/**
 * TrumboLogoSanta renders the Trumbo mark with the same theme/environment
 * adaptation as TrumboLogoVariable. (Kept as an alias so existing call sites
 * that referenced the festive variant continue to render the standard mark.)
 */
const TrumboLogoSanta = (props: SVGProps<SVGSVGElement> & { environment?: Environment }) => {
	const { environment, ...svgProps } = props
	const fillColor = environment ? getEnvironmentColor(environment) : "var(--vscode-icon-foreground)"

	return (
		<svg fill="none" height="50" viewBox="0 0 50 50" width="50" xmlns="http://www.w3.org/2000/svg" {...svgProps}>
			<path
				fillRule="evenodd"
				d="M15 3h20a12 12 0 0 1 12 12v20a12 12 0 0 1-12 12H15a12 12 0 0 1-12-12V15A12 12 0 0 1 15 3Zm-1 10h22v6H28v18h-6V19h-8v-6Z"
				fill={fillColor}
			/>
		</svg>
	)
}
export default TrumboLogoSanta
