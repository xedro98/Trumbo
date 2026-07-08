import { ArrowRight } from "@phosphor-icons/react";
import { marketingGridCellClass } from "@/components/grid-shell-context";
import { GridBox, GridBoxCell } from "@/components/ui/grid-box";
import { scrollToMarketingSection } from "@/lib/marketing-sections";
import { platformLink } from "@/lib/links";
import { cn } from "@/lib/utils";
const CARDS = [
	{
		title: "Bring agentic coding to your team",
		description:
			"Onboard developers with org invites, shared billing, and usage visibility from day one.",
		href: platformLink("/signup"),
		linkLabel: "Get started",
	},
	{
		title: "Our vision: software is the fastest path to useful agents",
		description:
			"Trumbo focuses on real repos, real workflows, and real shipping, in the shell, on the platform, and in chat.",
		onClick: () => scrollToMarketingSection("product"),
		linkLabel: "Product",
	},
	{
		title: "Join us building in the open",
		description:
			"Contribute to the CLI, SDK, and platform. We ship frequently and document what we learn.",
		href: "https://github.com/xedro98/Trumbo",
		linkLabel: "GitHub",
	},
] as const;

export function MissionSection() {
	return (
		<GridBox className="grid-cols-1 !border-t-0 md:grid-cols-3">
			<GridBoxCell className={cn("md:col-span-3", marketingGridCellClass)}>
				<h2 className="marketing-heading">
					Go further with us. From solo workflows to team platforms, and the people building
					both.
				</h2>
			</GridBoxCell>

			{CARDS.map((card) => (
				<GridBoxCell key={card.title} className={cn("flex flex-col", marketingGridCellClass)}>
					<h3 className="mb-3 text-lg font-semibold leading-snug">{card.title}</h3>
					<p className="mb-6 flex-1 text-sm text-muted-foreground">{card.description}</p>
					{"onClick" in card ? (
						<button
							type="button"
							onClick={card.onClick}
							className="font-stat inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
						>
							{card.linkLabel}
							<ArrowRight size={14} />
						</button>
					) : (
						<a
							href={card.href}
							target={card.href.startsWith("http") ? "_blank" : undefined}
							rel={card.href.startsWith("http") ? "noreferrer" : undefined}
							className="font-stat inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
						>
							{card.linkLabel}
							<ArrowRight size={14} />
						</a>
					)}
				</GridBoxCell>
			))}
		</GridBox>
	);
}
