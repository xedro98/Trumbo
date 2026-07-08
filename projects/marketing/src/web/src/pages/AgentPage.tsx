import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import {
	AgentCapabilitiesSection,
	AgentHeroSection,
	AgentHeroVisual,
	AgentKnowledgeSection,
	AgentStatsSection,
	AgentWorkflowSection,
} from "@/components/sections/AgentPageSections";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

export function AgentPage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<AgentHeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<AgentHeroVisual />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<AgentCapabilitiesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<AgentKnowledgeSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<AgentStatsSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<AgentWorkflowSection />
					</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
