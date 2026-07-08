import { cn } from "@/lib/utils";

/** Borders between blog cards in responsive multi-column grids. */
export function blogPostSeparatorClass(index: number): string | undefined {
	if (index === 0) return undefined;

	return cn(
		"border-grid-line",
		"border-t border-t-dotted",
		index % 2 === 0 && "md:border-l-0 md:border-t md:border-t-dotted",
		index % 2 !== 0 && "md:border-t-0 md:border-l md:border-l-solid",
		index % 3 === 0 && "lg:border-l-0 lg:border-t lg:border-t-dotted",
		index % 3 !== 0 && "lg:border-t-0 lg:border-l lg:border-l-solid",
	);
}
