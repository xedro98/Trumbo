import { useMarketingTheme } from "@/components/MarketingThemeProvider";
import type { MarketingTheme } from "@/lib/marketing-theme";
import { cn } from "@/lib/utils";
import { Desktop, Moon, Sun, type Icon } from "@phosphor-icons/react";

const THEME_TABS: {
	value: MarketingTheme;
	label: string;
	icon: Icon;
}[] = [
	{ value: "light", label: "Light", icon: Sun },
	{ value: "dark", label: "Dark", icon: Moon },
	{ value: "system", label: "System", icon: Desktop },
];

export function MarketingThemeSwitcher({
	className,
	onNavigate,
}: {
	className?: string;
	onNavigate?: () => void;
}) {
	const { theme, setTheme } = useMarketingTheme();

	return (
		<div
			role="tablist"
			aria-label="Theme"
			className={cn("flex w-full items-stretch py-3", className)}
		>
			{THEME_TABS.map((tab, index) => {
				const active = theme === tab.value;
				const Icon = tab.icon;

				return (
					<button
						key={tab.value}
						type="button"
						role="tab"
						aria-selected={active}
						aria-label={tab.label}
						title={tab.label}
						onClick={() => {
							setTheme(tab.value);
							onNavigate?.();
						}}
						className={cn(
							"inline-flex flex-1 cursor-pointer items-center justify-center py-2 transition-colors",
							index > 0 && "border-l border-l-dotted border-grid-line",
							active
								? "text-brand"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon size={16} weight={active ? "fill" : "regular"} aria-hidden="true" />
					</button>
				);
			})}
		</div>
	);
}
