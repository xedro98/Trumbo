import { GridShellProvider, marketingGridPadClass, marketingGridStackClass } from "@/components/grid-shell-context";
import { MarketingShell } from "@/components/MarketingShell";
import { GridBoxStack, GridBoxStackCell } from "@/components/ui/grid-box";
import { DevelopersSection } from "@/components/sections/DevelopersSection";
import { MarketingFooter } from "@/components/sections/FooterWatermark";
import { HeroSection, HeroVisual, ProductSection } from "@/components/sections/ProductSection";
import { cn } from "@/lib/utils";

export function HomePage() {
	return (
		<MarketingShell>
			<GridShellProvider>
				<GridBoxStack className={marketingGridStackClass}>
					<GridBoxStackCell className={cn(marketingGridPadClass, "pt-4 md:pt-6")}>
						<HeroSection />
					</GridBoxStackCell>
					<GridBoxStackCell className="!p-0">
						<HeroVisual />
					</GridBoxStackCell>
				<GridBoxStackCell id="product" className="scroll-mt-4 !p-0">
					<ProductSection />
				</GridBoxStackCell>
				<GridBoxStackCell id="developers" className="scroll-mt-4 !p-0">
					<DevelopersSection />
				</GridBoxStackCell>
					<GridBoxStackCell className={cn("!p-0", "last:border-b-0")}>
						<MarketingFooter />
					</GridBoxStackCell>
				</GridBoxStack>
			</GridShellProvider>
		</MarketingShell>
	);
}
