import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import {
	CompanyCareersSection,
	CompanyHeroSection,
	CompanyHeroVisual,
	CompanyMissionSection,
	CompanyStorySection,
	CompanyTeamSection,
	CompanyValuesSection,
} from "@/components/sections/CompanyPageSections";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

export function CompanyPage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<CompanyHeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CompanyHeroVisual />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CompanyMissionSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CompanyStorySection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CompanyValuesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CompanyTeamSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CompanyCareersSection />
					</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
