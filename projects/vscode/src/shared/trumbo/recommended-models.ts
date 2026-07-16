interface TrumboRecommendedModel {
	id: string
	name: string
	description: string
	tags: string[]
}

export interface TrumboRecommendedModelsData {
	recommended: TrumboRecommendedModel[]
	free: TrumboRecommendedModel[]
	/** Trumbo Quartz — the public frontier model family (three variants). */
	quartz: TrumboRecommendedModel[]
}

/**
 * Trumbo Quartz model family — the three variants users see as model cards.
 * The platform routes each turn server-side; these are the always-available
 * fallback entries for the picker's Quartz tab.
 */
export const TRUMBO_QUARTZ_MODELS: TrumboRecommendedModel[] = [
	{
		id: "quartz",
		name: "Quartz 1.0",
		description: "Adaptive reasoning model that scales compute to the complexity of each request.",
		tags: ["Quartz 1.0"],
	},
	{
		id: "quartz-lite",
		name: "Quartz 1.0 Lite",
		description: "Fast and economical Quartz variant for everyday agent loops and inline edits.",
		tags: ["Quartz 1.0 Lite"],
	},
	{
		id: "quartz-hyper",
		name: "Quartz 1.0 Hyper",
		description: "Flagship Quartz variant for maximum reasoning depth on hard engineering and research. Max/Ultra plans.",
		tags: ["Quartz 1.0 Hyper"],
	},
]

/** Public Quartz model ids. */
export const TRUMBO_QUARTZ_MODEL_IDS: ReadonlySet<string> = new Set(TRUMBO_QUARTZ_MODELS.map((model) => model.id))

/**
 * Hardcoded fallback shown when upstream recommended models are not enabled or unavailable.
 */
export const TRUMBO_RECOMMENDED_MODELS_FALLBACK: TrumboRecommendedModelsData = {
	recommended: [
		{
			id: "google/gemini-3.1-pro-preview",
			name: "Google Gemini 3.1 Pro Preview",
			description: "Latest Gemini release with 1m ctx window and strong coding performance",
			tags: ["NEW"],
		},
		{
			id: "anthropic/claude-sonnet-4.6",
			name: "Anthropic Claude Sonnet 4.6",
			description: "Latest Sonnet release with strong coding and agent performance",
			tags: ["NEW"],
		},
		{
			id: "anthropic/claude-opus-4.6",
			name: "Anthropic Claude Opus 4.6",
			description: "Most intelligent model for agents and coding",
			tags: ["BEST"],
		},
		{
			id: "openai/gpt-5.3-codex",
			name: "OpenAI GPT-5.3 Codex",
			description: "OpenAI's latest with strong coding abilities",
			tags: ["NEW"],
		},
	],
	free: [
		{
			id: "kwaipilot/kat-coder-pro",
			name: "KwaiKAT Kat Coder Pro",
			description: "KwaiKAT's most advanced agentic coding model in the KAT-Coder series",
			tags: ["FREE"],
		},
		{
			id: "arcee-ai/trinity-large-preview:free",
			name: "Arcee AI Trinity Large Preview",
			description: "Arcee AI's advanced large preview model in the Trinity series",
			tags: ["FREE"],
		},
	],
	quartz: TRUMBO_QUARTZ_MODELS,
}
