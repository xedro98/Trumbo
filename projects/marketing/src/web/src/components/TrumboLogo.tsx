import { TRUMBO_LOGO_MARK } from "@/lib/brand";
import { cn } from "@/lib/utils";

interface TrumboLogoProps {
	className?: string;
}

export function TrumboLogo({ className }: TrumboLogoProps) {
	return (
		<img
			src={TRUMBO_LOGO_MARK}
			alt="Trumbo"
			className={cn(className)}
			decoding="async"
		/>
	);
}
