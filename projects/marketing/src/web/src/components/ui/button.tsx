import { Button as KumoButton } from "@cloudflare/kumo";
import * as React from "react";
import { cn } from "@/lib/utils";

type LegacyVariant = "default" | "outline" | "secondary" | "ghost" | "link";
type LegacySize = "default" | "sm" | "lg";

const variantMap = {
	default: "primary",
	outline: "outline",
	secondary: "secondary",
	ghost: "ghost",
	link: "ghost",
} as const;

const sizeMap = {
	default: "lg",
	sm: "sm",
	lg: "lg",
} as const;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: LegacyVariant;
	size?: LegacySize;
	className?: string;
	loading?: boolean;
	icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
	{ className, variant = "default", size = "default", loading, icon, ...props },
	ref,
) {
	const isLink = variant === "link";

	return (
		<KumoButton
			ref={ref}
			variant={variantMap[variant]}
			size={sizeMap[size]}
			loading={loading}
			icon={icon}
			className={cn(
				"justify-center text-center",
				isLink && "h-auto px-0 text-kumo-link underline-offset-4 hover:underline",
				className,
			)}
			{...props}
		/>
	);
});

Button.displayName = "Button";
