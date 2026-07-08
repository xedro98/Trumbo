import { cn } from "@/lib/utils";

type ProductCardVisualVariant = "cli" | "platform";

const productCardImageWrapBaseClass = "pt-5 md:pt-6";

const productCardImageBoxClass = "relative w-full overflow-hidden border-b border-grid-line";

export function ProductCardVisual({
	src,
	alt = "",
	variant,
	className,
	fullBleed = false,
}: {
	src?: string;
	alt?: string;
	variant?: ProductCardVisualVariant;
	className?: string;
	fullBleed?: boolean;
}) {
	if (src) {
		if (fullBleed) {
			return (
				<div
					className={cn(
						"border-b border-grid-line px-5 pt-5 pb-5 md:px-6 md:pt-6 md:pb-6 lg:px-8 lg:pt-8 lg:pb-8",
						className,
					)}
				>
					<div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/10">
						<img
							src={src}
							alt={alt}
							className="absolute inset-0 block h-full w-full object-cover object-center"
							decoding="async"
						/>
					</div>
				</div>
			);
		}

		return (
			<div className={cn(productCardImageWrapBaseClass, className)}>
				<div className={cn(productCardImageBoxClass, "aspect-[16/10] border border-grid-line bg-muted/5")}>
					<img
						src={src}
						alt={alt}
						className="block h-full w-full object-cover object-center"
						decoding="async"
					/>
				</div>
			</div>
		);
	}

	if (variant === "cli") {
		return (
			<div className={cn(productCardImageWrapBaseClass, className)}>
				<div className={cn(productCardImageBoxClass, "bg-[#0c0f12]")} aria-hidden="true">
					<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(43,191,119,0.18),transparent_55%)]" />
					<div className="relative flex h-full flex-col p-4 md:p-5">
						<div className="mb-3 flex items-center gap-1.5">
							<span className="size-2 rounded-full bg-[#ff5f57]" />
							<span className="size-2 rounded-full bg-[#febc2e]" />
							<span className="size-2 rounded-full bg-[#28c840]" />
							<span className="ml-2 font-stat text-[10px] uppercase tracking-wider text-white/35">
								trumbo
							</span>
						</div>
						<div className="space-y-2 font-mono text-[11px] leading-relaxed md:text-xs">
							<p className="text-brand">› npm install -g @trumbodev/cli</p>
							<p className="text-white/55">› trumbo</p>
							<p className="text-white/80">Reading repo map…</p>
							<p className="text-white/45">edit src/app.tsx · run tests · search docs</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={cn(productCardImageWrapBaseClass, className)}>
			<div className={cn(productCardImageBoxClass, "bg-[#f4f6f8]")} aria-hidden="true">
				<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(43,191,119,0.12),transparent_50%)]" />
				<div className="relative flex h-full flex-col p-4 md:p-5">
					<div className="mb-4 flex items-center justify-between">
						<div className="h-2 w-16 rounded-full bg-foreground/10" />
						<div className="h-6 w-20 rounded-md bg-brand/15" />
					</div>
					<div className="mb-3 grid grid-cols-3 gap-2">
						<div className="h-10 bg-white/80" />
						<div className="h-10 bg-white/80" />
						<div className="h-10 bg-white/80" />
					</div>
					<div className="flex flex-1 items-end gap-1.5">
						{[38, 52, 44, 68, 58, 72, 48].map((height, index) => (
							<div
								key={index}
								className="flex-1 rounded-t-sm bg-brand/25"
								style={{ height: `${height}%` }}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
