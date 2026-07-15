import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import {
	SecurityArchitectureSection,
	SecurityCapabilitiesSection,
	SecurityCategoriesSection,
	SecurityHeroIllustration,
	SecurityHeroSection,
	SecurityIntegrationsSection,
	SecurityOperationsSection,
	SecurityRemediationSection,
	SecurityRuntimeSection,
	SecurityScanModesSection,
	SecuritySupplyChainSection,
	SecurityTestimonialsSection,
} from "@/components/sections/SecurityPageSections";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

export function SecurityPage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<SecurityHeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityHeroIllustration />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityScanModesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityCapabilitiesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityRuntimeSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecuritySupplyChainSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityRemediationSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityCategoriesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityIntegrationsSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityArchitectureSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityOperationsSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SecurityTestimonialsSection />
					</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
