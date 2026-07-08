import BrandMark from "./BrandMark"
import type { Environment } from "../../../../src/shared/config-types"
import { cn } from "@/lib/utils"

type BrandLockupProps = {
	/** Mark size in px (the wordmark scales relative to it). */
	size?: number
	/** Show the "Trumbo" wordmark beside the mark. */
	showWordmark?: boolean
	/** Render the wordmark in the brand gradient. */
	gradientWordmark?: boolean
	environment?: Environment
	className?: string
}

/**
 * BrandLockup — the Trumbo mark paired with the "Trumbo" wordmark.
 *
 * Used on hero/welcome surfaces and branded headers for a consistent
 * brand presence. The wordmark is set in Space Grotesk (the Trumbo
 * heading face) with tight tracking.
 */
const BrandLockup = ({
	size = 28,
	showWordmark = true,
	gradientWordmark = false,
	environment,
	className,
}: BrandLockupProps) => {
	return (
		<div className={cn("flex items-center gap-2.5 select-none", className)}>
			<BrandMark
				environment={environment}
				height={size}
				width={size}
				style={{ height: size, width: size }}
			/>
			{showWordmark && (
				<span
					className={cn(
						"font-heading font-semibold leading-none tracking-[-0.02em]",
						gradientWordmark ? "trumbo-gradient-text" : "trumbo-brand-text",
					)}
					style={{ fontSize: Math.round(size * 0.62) }}>
					Trumbo
				</span>
			)}
		</div>
	)
}

export default BrandLockup
