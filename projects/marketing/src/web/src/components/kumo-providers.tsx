import { LinkProvider, Toasty, TooltipProvider } from "@cloudflare/kumo";
import { forwardRef, type ReactNode } from "react";
import { Link as WouterLink } from "wouter";
import type { LinkComponentProps } from "@cloudflare/kumo";

const AppLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(function AppLink(
	{ href, to: _to, ...rest },
	ref,
) {
	return <WouterLink ref={ref} href={href ?? "/"} {...rest} />;
});

export function KumoProviders({ children }: { children: ReactNode }) {
	return (
		<LinkProvider component={AppLink}>
			<TooltipProvider>
				<Toasty>{children}</Toasty>
			</TooltipProvider>
		</LinkProvider>
	);
}
