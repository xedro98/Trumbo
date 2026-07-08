import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { hasCookieConsent, persistCookieConsent } from "@/lib/cookie-consent";
import { cn } from "@/lib/utils";

export function CookieConsent() {
	const [open, setOpen] = useState(false);

	useEffect(() => {
		if (hasCookieConsent()) {
			return;
		}

		const timer = window.setTimeout(() => setOpen(true), 500);
		return () => window.clearTimeout(timer);
	}, []);

	if (!open) {
		return null;
	}

	const accept = () => {
		persistCookieConsent();
		setOpen(false);
	};

	return (
		<div
			className={cn(
				"pointer-events-none fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6",
				"lg:left-[calc(var(--nav-width)+var(--nav-gutter))] lg:max-w-[calc(100%-var(--nav-width)-var(--nav-gutter))]",
			)}
			role="region"
			aria-label="Cookie notice"
		>
			<div
				className={cn(
					"marketing-glass-panel pointer-events-auto relative mx-auto flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-dotted border-grid-line p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5 sm:p-5",
				)}
			>
				<div className="marketing-glass-backdrop" aria-hidden="true" />
				<div className="marketing-glass-shine" aria-hidden="true" />
				<div className="relative z-10 min-w-0 space-y-1">
					<p className="font-stat text-[0.6875rem] uppercase tracking-[0.08em] text-muted-foreground">
						Cookie chat
					</p>
					<p className="text-sm leading-relaxed text-muted-foreground">
						We only use the boring essentials: theme preference and basic site function. No
						trackers, no ad pixels, no following you around the internet.{" "}
						<Link
							href="/privacy"
							className="text-foreground underline-offset-2 transition-colors hover:text-brand hover:underline"
						>
							Privacy policy
						</Link>{" "}
						if you want the fine print.
					</p>
				</div>
				<Button
					type="button"
					variant="default"
					size="sm"
					className="relative z-10 shrink-0 sm:min-w-[5.75rem]"
					onClick={accept}
				>
					Got it
				</Button>
			</div>
		</div>
	);
}
