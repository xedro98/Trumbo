import { createContext, useContext, useEffect, useState } from "react";
import { getTerminalTheme, type TerminalTheme } from "../palette";
import { startThemeWatcher, subscribeThemeChanges } from "../utils/themes";

export interface TerminalColors {
	background: string | null;
	foreground: string | null;
}

export const TerminalColorsContext = createContext<TerminalColors>({
	background: null,
	foreground: null,
});

export function useTerminalBackground(): string | null {
	return useContext(TerminalColorsContext).background;
}

export function useTerminalForeground(): string | null {
	return useContext(TerminalColorsContext).foreground;
}

export function useTerminalTheme(): TerminalTheme {
	const { background, foreground } = useContext(TerminalColorsContext);
	return getTerminalTheme(background, foreground);
}

/**
 * Start the theme-file watcher and re-render the calling component when the
 * theme set changes (a theme file is added/edited/removed in
 * ~/.trumbo/themes/). Returns a version counter that increments on each
 * change so the resolved theme palette is re-read on the next render.
 */
export function useThemeReload(): number {
	const [version, setVersion] = useState(0);
	useEffect(() => {
		startThemeWatcher();
		const unsubscribe = subscribeThemeChanges(() => {
			setVersion((v) => v + 1);
		});
		return unsubscribe;
	}, []);
	return version;
}
