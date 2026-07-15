import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import {
	BrowserRunArchitectureSection,
	BrowserRunBenchmarkSection,
	BrowserRunCapabilitiesSection,
	BrowserRunCtaSection,
	BrowserRunHeroSection,
	BrowserRunHeroVisual,
	BrowserRunToolMosaic,
	BrowserRunUseCasesSection,
} from "@/components/sections/BrowserRunPageSections";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

export function BrowserRunPage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<BrowserRunHeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<BrowserRunHeroVisual />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<BrowserRunCapabilitiesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<BrowserRunUseCasesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<BrowserRunToolMosaic />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<BrowserRunBenchmarkSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<BrowserRunArchitectureSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<BrowserRunCtaSection />
					</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
