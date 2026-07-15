import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import {
	CloudAgentsArchitectureSection,
	CloudAgentsBenchmarkSection,
	CloudAgentsCapabilitiesSection,
	CloudAgentsConnectorStrip,
	CloudAgentsHeroDiagram,
	CloudAgentsHeroSection,
	CloudAgentsOperationsSection,
} from "@/components/sections/CloudAgentsPageSections";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

export function CloudAgentsPage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<CloudAgentsHeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CloudAgentsHeroDiagram />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CloudAgentsArchitectureSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CloudAgentsOperationsSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CloudAgentsCapabilitiesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CloudAgentsConnectorStrip />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<CloudAgentsBenchmarkSection />
					</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
