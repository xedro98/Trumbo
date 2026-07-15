import {
	GridShellProvider,
	marketingGridPadClass,
	marketingGridStackClass,
} from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import {
	SandboxBenchmarkSection,
	SandboxCapabilitiesSection,
	SandboxCtaSection,
	SandboxHeroSection,
	SandboxLifecycleSection,
	SandboxSpecsSection,
	SandboxUseCasesSection,
} from "@/components/sections/SandboxPageSections";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { cn } from "@/lib/utils";

export function SandboxPage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<SandboxHeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SandboxLifecycleSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SandboxBenchmarkSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SandboxCapabilitiesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SandboxUseCasesSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SandboxSpecsSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<SandboxCtaSection />
					</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
