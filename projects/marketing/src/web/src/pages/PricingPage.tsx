import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import {
	PricingFaqSection,
	PricingHeroSection,
	PricingIncludedSection,
	PricingLimitsSection,
	PricingTiersSection,
} from "@/components/sections/PricingPageSections";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

export function PricingPage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<PricingHeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<PricingTiersSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<PricingLimitsSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<PricingIncludedSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<PricingFaqSection />
					</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
