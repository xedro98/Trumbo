import { TRUMBO_LOGO_MARK } from "@/lib/brand";

export const SITE_NAME = "Trumbo";
export const SITE_URL = "https://trumbo.dev";

export const DEFAULT_DESCRIPTION =
	"Trumbo is an AI lab building reasoning models, developer tools, and the infrastructure to run them. Open source CLI, 210+ hosted models, flat-rate pricing.";

export const DEFAULT_OG_IMAGE = TRUMBO_LOGO_MARK;

export type PageSEOConfig = {
	/** Page name before the " - Trumbo" suffix. Omit suffix on homepage. */
	title: string;
	description: string;
	/** When true, document title is exactly `title` (homepage). */
	titleOnly?: boolean;
	noIndex?: boolean;
	type?: "website" | "article";
	image?: string;
};

export function formatPageTitle(title: string, titleOnly = false): string {
	if (titleOnly || title === SITE_NAME) {
		return SITE_NAME;
	}
	return `${title} - ${SITE_NAME}`;
}

export function absoluteUrl(path = "/"): string {
	const normalized = path.startsWith("/") ? path : `/${path}`;
	return `${SITE_URL}${normalized === "/" ? "" : normalized}`;
}

/** Static marketing routes and their SEO metadata. */
export const STATIC_PAGE_SEO: Record<string, PageSEOConfig> = {
	"/": {
		title: SITE_NAME,
		titleOnly: true,
		description:
			"Trumbo is where builders run agents in the terminal. Open models, real tools, and a platform built for your whole team.",
	},
	"/agent": {
		title: "Trumbo Agent",
		description:
			"Open source coding agent for daily work. Edit files, run shell commands, search your codebase, call MCP tools, and ground answers in your team's docs with Trumbo Knowledge.",
	},
	"/quartz": {
		title: "Trumbo Quartz",
		description:
			"Quartz 1.0 introduces Hyper and Lite, two adaptive reasoning models on one architecture. Flagship depth or fast, economical reasoning for agent work.",
	},
	"/cloud-agents": {
		title: "Cloud Agents",
		description:
			"Autonomous AI agents running on Trumbo's cloud infrastructure with persistent state, scheduled tasks, multi-agent teams, and channel connectors for Slack, Discord, Linear, and more.",
	},
	"/sandbox": {
		title: "Sandbox",
		description:
			"Remote Linux VM code execution on Trumbo Sandbox. Isolated, credit-billed sandbox sessions for code interpreters, CI/CD, interactive development, and test runners.",
	},
	"/browser-run": {
		title: "Browser Run",
		description:
			"Interactive cloud browser sessions on Trumbo Browser Run with CDP control, screenshots, markdown extraction, PDF export, and live view URLs for agent-driven web automation.",
	},
	"/security": {
		title: "Trumbo Security",
		description:
			"LLM-first application security with the Sentinel six-stage pipeline, seven check categories including AI agent trust, diff-aware PR scans, runtime protection, supply chain monitoring, and AI remediation on platform.trumbo.dev.",
	},
	"/models": {
		title: "Model Library",
		description:
			"Browse 210+ open models available through Trumbo, from DeepSeek, Qwen, Llama, Mistral, GLM, Kimi, and more. Route any model from one CLI.",
	},
	"/pricing": {
		title: "Pricing",
		description:
			"Personal plans from $20/month, team plans from $40/seat/month, and Enterprise with custom limits. Flat-rate billing with no per-token charges.",
	},
	"/company": {
		title: "Company",
		description:
			"Trumbo is an AI company researching adaptive reasoning and building the models, infrastructure, and products that put it to work.",
	},
	"/blog": {
		title: "Blog",
		description:
			"Research notes, release write-ups, and engineering deep dives from the Trumbo team.",
	},
	"/privacy": {
		title: "Privacy Policy",
		description:
			"How Trumbo collects, uses, stores, and protects personal information across trumbo.dev and platform.trumbo.dev.",
	},
	"/terms": {
		title: "Terms of Service",
		description:
			"Terms governing access to Trumbo services, subscriptions, acceptable use, intellectual property, and dispute resolution.",
	},
	"/refund": {
		title: "Refund Policy",
		description:
			"Refund eligibility, billing model clarification, upgrade and downgrade rules, and how to request a refund from Trumbo.",
	},
};

const ADMIN_PREFIX = "/admin";

export function resolveStaticPageSEO(pathname: string): PageSEOConfig | null {
	if (pathname.startsWith(ADMIN_PREFIX)) {
		return {
			title: "Admin",
			description: "Trumbo marketing site administration.",
			noIndex: true,
		};
	}

	if (STATIC_PAGE_SEO[pathname]) {
		return STATIC_PAGE_SEO[pathname];
	}

	if (pathname.startsWith("/blog/") && pathname !== "/blog/") {
		return null;
	}

	return STATIC_PAGE_SEO["/"] ?? null;
}

export const SITEMAP_STATIC_PATHS = [
	"/",
	"/agent",
	"/quartz",
	"/cloud-agents",
	"/sandbox",
	"/browser-run",
	"/security",
	"/models",
	"/pricing",
	"/company",
	"/blog",
	"/privacy",
	"/terms",
	"/refund",
] as const;

export const ORGANIZATION_JSON_LD = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: SITE_NAME,
	url: SITE_URL,
	logo: TRUMBO_LOGO_MARK,
	sameAs: ["https://github.com/xedro98/Trumbo"],
};

export const WEBSITE_JSON_LD = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: SITE_NAME,
	url: SITE_URL,
};

export const HOME_JSON_LD = [ORGANIZATION_JSON_LD, WEBSITE_JSON_LD];
