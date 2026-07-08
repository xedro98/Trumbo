import {
	applyMarketingTheme,
	persistMarketingTheme,
	readStoredMarketingTheme,
	resolveMarketingTheme,
	type MarketingTheme,
	type ResolvedMarketingTheme,
} from "@/lib/marketing-theme";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from "react";

type MarketingThemeContextValue = {
	theme: MarketingTheme;
	resolvedTheme: ResolvedMarketingTheme;
	setTheme: (theme: MarketingTheme) => void;
	cycleTheme: () => void;
};

const MarketingThemeContext = createContext<MarketingThemeContextValue | null>(null);

export function MarketingThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setThemeState] = useState<MarketingTheme>(() => readStoredMarketingTheme());
	const [resolvedTheme, setResolvedTheme] = useState<ResolvedMarketingTheme>(() =>
		resolveMarketingTheme(readStoredMarketingTheme()),
	);

	const setTheme = useCallback((next: MarketingTheme) => {
		setThemeState(next);
		persistMarketingTheme(next);
		applyMarketingTheme(next);
		setResolvedTheme(resolveMarketingTheme(next));
	}, []);

	const cycleTheme = useCallback(() => {
		setThemeState((current) => {
			const next = current === "light" ? "dark" : current === "dark" ? "system" : "light";
			persistMarketingTheme(next);
			applyMarketingTheme(next);
			setResolvedTheme(resolveMarketingTheme(next));
			return next;
		});
	}, []);

	useEffect(() => {
		applyMarketingTheme(theme);
		setResolvedTheme(resolveMarketingTheme(theme));
	}, [theme]);

	useEffect(() => {
		if (theme !== "system") {
			return;
		}

		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			applyMarketingTheme("system");
			setResolvedTheme(resolveMarketingTheme("system"));
		};

		media.addEventListener("change", onChange);
		return () => media.removeEventListener("change", onChange);
	}, [theme]);

	const value = useMemo(
		() => ({ theme, resolvedTheme, setTheme, cycleTheme }),
		[theme, resolvedTheme, setTheme, cycleTheme],
	);

	return (
		<MarketingThemeContext.Provider value={value}>{children}</MarketingThemeContext.Provider>
	);
}

export function useMarketingTheme() {
	const context = useContext(MarketingThemeContext);
	if (!context) {
		throw new Error("useMarketingTheme must be used within MarketingThemeProvider");
	}
	return context;
}
