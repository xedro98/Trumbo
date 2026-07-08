import type { ReactNode } from "react";
import { CookieConsent } from "@/components/CookieConsent";
import { MarketingMobileNav, MarketingNav } from "@/components/MarketingSidebar";
import { MarketingSectionProvider } from "@/components/MarketingSectionProvider";
import { MarketingThemeProvider } from "@/components/MarketingThemeProvider";
import { marketingShellMainClass } from "@/components/grid-shell-context";

export function MarketingShell({ children }: { children: ReactNode }) {
	return (
		<MarketingThemeProvider>
			<MarketingSectionProvider>
				<div className="min-h-dvh bg-background">
					<MarketingMobileNav />
					<div className="mx-auto flex min-h-dvh w-full min-[1600px]:max-w-[var(--shell-max-width)]">
						<MarketingNav />
						<main className={marketingShellMainClass}>{children}</main>
					</div>
					<CookieConsent />
				</div>
			</MarketingSectionProvider>
		</MarketingThemeProvider>
	);
}
