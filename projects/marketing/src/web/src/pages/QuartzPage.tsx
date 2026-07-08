import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import {
	QuartzAdaptiveSection,
	QuartzArchitectureSection,
	QuartzCapabilitiesSection,
	QuartzHeroDiagram,
	QuartzHeroSection,
	QuartzLineupSection,
	QuartzPhilosophySection,
	QuartzPipelineSection,
	QuartzSpecsSection,
} from "@/components/sections/QuartzPageSections";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

export function QuartzPage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<QuartzHeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<QuartzHeroDiagram />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<QuartzLineupSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<QuartzPipelineSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<QuartzArchitectureSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<QuartzAdaptiveSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<QuartzCapabilitiesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<QuartzSpecsSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<QuartzPhilosophySection />
					</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
