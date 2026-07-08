import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { RouteSEO } from "@/components/PageSEO";
import { AdminPage } from "@/pages/AdminPage";
import { AgentPage } from "@/pages/AgentPage";
import { BlogIndexPage, BlogPostPage } from "@/pages/BlogPages";
import { CompanyPage } from "@/pages/CompanyPage";
import { HomePage } from "@/pages/HomePage";
import { PrivacyPage, RefundPage, TermsPage } from "@/pages/LegalPages";
import { ModelLibraryPage } from "@/pages/ModelLibraryPage";
import { PricingPage } from "@/pages/PricingPage";
import { QuartzPage } from "@/pages/QuartzPage";

function ScrollToTop() {
	const [location] = useLocation();
	useEffect(() => {
		requestAnimationFrame(() => {
			window.scrollTo(0, 0);
			const scrollEl = document.querySelector(".main-scroll");
			if (scrollEl instanceof HTMLElement) {
				scrollEl.scrollTop = 0;
			}
		});
	}, [location]);
	return null;
}

export default function App() {
	const [location] = useLocation();

	return (
		<>
			<RouteSEO pathname={location} />
			<ScrollToTop />
			<Switch>
			<Route path="/" component={HomePage} />
			<Route path="/agent" component={AgentPage} />
			<Route path="/quartz" component={QuartzPage} />
			<Route path="/models" component={ModelLibraryPage} />
			<Route path="/pricing" component={PricingPage} />
			<Route path="/company" component={CompanyPage} />
			<Route path="/blog" component={BlogIndexPage} />
			<Route path="/blog/:slug" component={BlogPostPage} />

			{/* Admin — explicit routes (no nest, so Links stay absolute) */}
			<Route path="/admin/posts/new" component={AdminPage} />
			<Route path="/admin/posts/:id" component={AdminPage} />
			<Route path="/admin/posts" component={AdminPage} />
			<Route path="/admin/categories" component={AdminPage} />
			<Route path="/admin" component={AdminPage} />

			<Route path="/privacy" component={PrivacyPage} />
			<Route path="/terms" component={TermsPage} />
			<Route path="/refund" component={RefundPage} />
			<Route component={HomePage} />
			</Switch>
		</>
	);
}
