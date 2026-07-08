import { cn } from "@heroui/theme"
import { HTMLAttributes } from "react"

type SectionHeaderProps = HTMLAttributes<HTMLDivElement> & {
	children: React.ReactNode
	description?: string
}

/**
 * SectionHeader — the titled header rendered at the top of each settings
 * section. Brand heading font, a hairline brand bottom edge, and an optional
 * description. Clamped horizontal padding so long content stays readable.
 */
const SectionHeader = ({ description, children, className, ...props }: SectionHeaderProps) => {
	return (
		<div
			className={cn(
				"trumbo-edge-bottom px-5 py-3.5 text-[color:var(--vscode-foreground)]",
				className,
			)}
			{...props}>
			<h2 className="m-0 font-heading text-base font-semibold tracking-[-0.014em]">{children}</h2>
			{description && (
				<p className="mb-0 mt-1.5 text-[13px] leading-relaxed text-[color:var(--vscode-descriptionForeground)]">
					{description}
				</p>
			)}
		</div>
	)
}

export default SectionHeader
