import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";
import {
	clearMarketingSectionHash,
	getActiveMarketingSection,
	MARKETING_SECTION_IDS,
	scrollToMarketingSection,
	type MarketingSectionId,
} from "@/lib/marketing-sections";

interface MarketingSectionContextValue {
	activeSection: MarketingSectionId | null;
	scrollToSection: (id: MarketingSectionId) => void;
}

const MarketingSectionContext = createContext<MarketingSectionContextValue | null>(null);

export function MarketingSectionProvider({ children }: { children: ReactNode }) {
	const [activeSection, setActiveSection] = useState<MarketingSectionId | null>(null);

	const updateActiveSection = useCallback(() => {
		setActiveSection(getActiveMarketingSection(MARKETING_SECTION_IDS));
	}, []);

	useEffect(() => {
		const hash = window.location.hash.slice(1);
		if (MARKETING_SECTION_IDS.includes(hash as MarketingSectionId)) {
			document.getElementById(hash)?.scrollIntoView({ block: "start" });
		}
		clearMarketingSectionHash();
		updateActiveSection();

		const onHashChange = () => clearMarketingSectionHash();
		window.addEventListener("hashchange", onHashChange);
		return () => window.removeEventListener("hashchange", onHashChange);
	}, [updateActiveSection]);

	useEffect(() => {
		window.addEventListener("scroll", updateActiveSection, { passive: true });
		window.addEventListener("resize", updateActiveSection);
		return () => {
			window.removeEventListener("scroll", updateActiveSection);
			window.removeEventListener("resize", updateActiveSection);
		};
	}, [updateActiveSection]);

	const scrollToSection = useCallback((id: MarketingSectionId) => {
		scrollToMarketingSection(id);
		setActiveSection(id);
	}, []);

	return (
		<MarketingSectionContext.Provider value={{ activeSection, scrollToSection }}>
			{children}
		</MarketingSectionContext.Provider>
	);
}

export function useMarketingSection() {
	const context = useContext(MarketingSectionContext);
	if (!context) {
		throw new Error("useMarketingSection must be used within MarketingSectionProvider");
	}
	return context;
}
