import { createContext, useContext, type ReactNode } from "react";

const GridShellContext = createContext(false);

export function GridShellProvider({ children }: { children: ReactNode }) {
	return (
		<GridShellContext.Provider value={true}>{children}</GridShellContext.Provider>
	);
}

export function useGridShellConnected(): boolean {
	return useContext(GridShellContext);
}

/** Horizontal inset for page titles and controls above connected grids. */
export const shellPageInsetClass = "px-4 md:px-6";

/** Solid frame borders for shell chrome. */
export const shellFrameBorderClass = "border-grid-line";

/** Standard padding inside marketing grid cells. */
export const marketingGridPadClass =
	"!py-6 !pr-6 !pl-8 md:!py-8 md:!pr-8 md:!pl-10 lg:!py-10 lg:!pr-10 lg:!pl-12";

/** Padding for section grid cells and nested content blocks. */
export const marketingGridCellClass =
	"!py-5 !pr-5 md:!py-6 md:!pr-6 !pl-8 md:!pl-10 lg:!pl-12";

/** Inner content wrapper when the cell uses !p-0 for nested lists. */
export const marketingGridContentClass =
	"py-5 pr-5 md:py-6 md:pr-6 pl-8 md:pl-10 lg:pl-12";

/** List rows aligned with section cell content inset. */
export const marketingGridListRowClass = "!px-0 !pl-8 !pr-5 md:!pl-10 md:!pr-6 lg:!pl-12";

/** Main content column — right frame edge connected to the page grid. */
export const marketingShellMainClass =
	"main-scroll flex min-h-dvh min-w-0 flex-1 flex-col border-r border-r-dotted border-grid-line bg-marketing-content max-lg:border-r-0";

/** Connected stack inside the main shell (no outer left/right — shell provides edges). */
export const marketingGridStackClass =
	"min-h-full flex-1 border-y border-grid-line bg-marketing-content md:border-x-0";
