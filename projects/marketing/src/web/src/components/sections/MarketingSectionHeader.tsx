import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function MarketingSectionHeader({
	kicker,
	title,
	description,
	descriptionClassName,
	className,
}: {
	kicker?: string;
	title: string;
	description?: string;
	descriptionClassName?: string;
	className?: string;
}) {
	return (
		<div className={cn(className)}>
			{kicker ? <p className="marketing-kicker mb-4">{kicker}</p> : null}
			<h2 className="marketing-heading">{title}</h2>
			{description ? (
				<p
					className={cn(
						"mt-4 max-w-3xl text-muted-foreground",
						descriptionClassName,
					)}
				>
					{description}
				</p>
			) : null}
		</div>
	);
}

export function SectionFooterLink({
	href,
	children,
	external,
	className,
}: {
	href: string;
	children: ReactNode;
	external?: boolean;
	className?: string;
}) {
	return (
		<a
			href={href}
			target={external ? "_blank" : undefined}
			rel={external ? "noreferrer" : undefined}
			className={cn(
				"font-stat inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground",
				className,
			)}
		>
			{children}
		</a>
	);
}
