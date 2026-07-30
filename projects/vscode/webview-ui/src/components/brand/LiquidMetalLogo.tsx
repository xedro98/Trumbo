import { LiquidMetal } from "@paper-design/shaders-react"
import { cn } from "@/lib/utils"
import trumboLogoUrl from "@/assets/trumbo-logo.svg?url"

type LiquidMetalLogoProps = {
	/** Pixel size of the square render surface. */
	size?: number
	/** Optional className applied to the wrapper. */
	className?: string
	/** Animation speed (0 = static). */
	speed?: number
	/** Overall zoom of the glyph inside the canvas. */
	scale?: number
	/** Tint color (color-burn blended over the metal). Defaults to brand green. */
	colorTint?: string
}

/**
 * LiquidMetalLogo — the Trumbo "T" lettermark rendered as a futuristic liquid
 * metal material via the @paper-design/shaders-react `LiquidMetal` shader.
 *
 * The official `trumbo-logo.svg` (transparent background) is fed to the shader
 * as an effect mask, so the metal fills the T glyph and its circular accent.
 * The tint is the Trumbo brand green by default; pass `colorTint` to override.
 */
const LiquidMetalLogo = ({
	size = 80,
	className,
	speed = 1,
	scale = 0.6,
	colorTint = "var(--brand, #2BBF77)",
}: LiquidMetalLogoProps) => {
	return (
		<div
			className={cn("relative flex items-center justify-center", className)}
			style={{ width: size, height: size }}>
			<LiquidMetal
				width={size}
				height={size}
				image={trumboLogoUrl}
				shape={undefined}
				colorBack="#aaaaac00"
				colorTint={colorTint}
				repetition={2}
				softness={0.1}
				shiftRed={0.3}
				shiftBlue={0.3}
				distortion={0.07}
				contour={0.4}
				angle={70}
				speed={speed}
				scale={scale}
				fit="contain"
			/>
		</div>
	)
}

export default LiquidMetalLogo
