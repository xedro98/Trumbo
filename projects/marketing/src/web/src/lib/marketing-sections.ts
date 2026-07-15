export const MARKETING_NAV_ITEMS = [
	{ label: "Product", id: "product" },
	{ label: "Models", id: "developers" },
] as const;

export type MarketingExploreItem = {
	label: string;
	href: string;
	external?: boolean;
};

export type MarketingExploreGroup = {
	group: string;
	items: MarketingExploreItem[];
};

export type MarketingExploreEntry = MarketingExploreItem | MarketingExploreGroup;

function isExploreGroup(
	entry: MarketingExploreEntry,
): entry is MarketingExploreGroup {
	return "group" in entry;
}

export function isMarketingExploreGroup(
	entry: MarketingExploreEntry,
): entry is MarketingExploreGroup {
	return isExploreGroup(entry);
}

export const MARKETING_EXPLORE_ITEMS: readonly MarketingExploreEntry[] = [
	{ label: "Trumbo Agent", href: "/agent" },
	{ label: "Trumbo Quartz", href: "/quartz" },
	{ label: "Trumbo Security", href: "/security" },
	{
		group: "Agentic Cloud",
		items: [
			{ label: "Cloud Agents", href: "/cloud-agents" },
			{ label: "Sandbox", href: "/sandbox" },
			{ label: "Browser Run", href: "/browser-run" },
		],
	},
	{ label: "Model Library", href: "/models" },
	{ label: "Pricing", href: "/pricing" },
	{ label: "Company", href: "/company" },
	{ label: "Blog & Research", href: "/blog" },
];

export type MarketingSectionId = (typeof MARKETING_NAV_ITEMS)[number]["id"];

export const MARKETING_SECTION_IDS: MarketingSectionId[] = MARKETING_NAV_ITEMS.map(
	(item) => item.id,
);

const SCROLL_OFFSET = 160;

export function scrollToMarketingSection(id: MarketingSectionId) {
	const element = document.getElementById(id);
	if (!element) return;

	element.scrollIntoView({ behavior: "smooth", block: "start" });
	clearMarketingSectionHash();
}

export function clearMarketingSectionHash() {
	const { pathname, search } = window.location;
	if (!window.location.hash) return;
	window.history.replaceState(null, "", `${pathname}${search}`);
}

export function getActiveMarketingSection(
	sectionIds: readonly MarketingSectionId[],
): MarketingSectionId | null {
	let active: MarketingSectionId | null = null;

	for (const id of sectionIds) {
		const element = document.getElementById(id);
		if (element && element.getBoundingClientRect().top <= SCROLL_OFFSET) {
			active = id;
		}
	}

	return active;
}
