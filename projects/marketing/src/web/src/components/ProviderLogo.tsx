import { cn } from "@/lib/utils";

export function ProviderLogo({
	logoUrl,
	className,
	onError,
	onLoad,
}: {
	logoUrl: string;
	className?: string;
	onError?: () => void;
	onLoad?: () => void;
}) {
	return (
		<img
			src={logoUrl}
			alt=""
			aria-hidden
			className={cn("provider-lab-logo size-7 shrink-0 object-contain", className)}
			decoding="async"
			loading="lazy"
			onError={onError}
			onLoad={onLoad}
		/>
	);
}
