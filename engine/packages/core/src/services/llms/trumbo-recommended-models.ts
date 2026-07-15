import {
	isUnconfiguredTrumboUrl,
	resolveTrumboApiBaseUrl,
	resolveTrumboEnvironment,
} from "@trumbodev/shared";
import { ProviderSettingsManager } from "../storage/provider-settings-manager";

export interface TrumboRecommendedModel {
	id: string;
	name: string;
	description: string;
	tags: string[];
}

export interface TrumboRecommendedModelsData {
	recommended: TrumboRecommendedModel[];
	free: TrumboRecommendedModel[];
	trumboPass: TrumboRecommendedModel[];
}

export interface FetchTrumboRecommendedModelsOptions {
	baseUrl?: string;
	fetchImpl?: typeof fetch;
	providerSettingsManager?: Pick<
		ProviderSettingsManager,
		"getProviderSettings"
	>;
	timeoutMs?: number;
}

const DEFAULT_REQUEST_TIMEOUT_MS = 5_000;
/** Featured picker shows a small set; full library is under "Browse all models". */
const MAX_FEATURED_TRUMBO_MODELS = 8;

/** Bundled OpenRouter-style list for hosted TrumboPass when the cloud API is down. */
export const FALLBACK_TRUMBO_RECOMMENDED_MODELS: TrumboRecommendedModelsData = {
	recommended: [
		{
			id: "anthropic/claude-opus-4.6",
			name: "Claude Opus 4.6",
			description: "Most intelligent model for agents and coding",
			tags: ["BEST"],
		},
		{
			id: "anthropic/claude-sonnet-4.6",
			name: "Claude Sonnet 4.6",
			description: "Strong coding and agent performance",
			tags: ["NEW"],
		},
		{
			id: "google/gemini-3.1-pro-preview",
			name: "Gemini 3.1 Pro Preview",
			description: "1M context window, strong coding performance",
			tags: ["NEW"],
		},
		{
			id: "openai/gpt-5.3-codex",
			name: "GPT-5.3 Codex",
			description: "OpenAI's latest with strong coding abilities",
			tags: ["NEW"],
		},
	],
	free: [
		{
			id: "kwaipilot/kat-coder-pro",
			name: "KwaiKAT Kat Coder Pro",
			description: "Advanced agentic coding model",
			tags: ["FREE"],
		},
		{
			id: "arcee-ai/trinity-large-preview:free",
			name: "Arcee AI Trinity Large Preview",
			description: "Advanced large preview model",
			tags: ["FREE"],
		},
	],
	trumboPass: [],
};

/** Self-hosted Trumbo web app catalog when the live fetch is unavailable. */
export const SELF_HOSTED_TRUMBO_RECOMMENDED_MODELS: TrumboRecommendedModelsData =
	{
		recommended: [
			{
				id: "glm-5p2",
				name: "GLM 5.2",
				description: "Strong general coding model.",
				tags: ["BEST"],
			},
			{
				id: "kimi-k2p7-code",
				name: "Kimi K2.7 Code",
				description: "Code-focused model.",
				tags: [],
			},
			{
				id: "minimax-m3",
				name: "MiniMax M3",
				description: "Fast coding assistant.",
				tags: [],
			},
			{
				id: "qwen3p7-plus",
				name: "Qwen 3.7 Plus",
				description: "Qwen 3.7 Plus.",
				tags: [],
			},
		],
		free: [],
		trumboPass: [],
	};

function cloneRecommendedModels(
	data: TrumboRecommendedModelsData,
): TrumboRecommendedModelsData {
	return {
		recommended: data.recommended.map((model) => ({
			...model,
			tags: [...model.tags],
		})),
		free: data.free.map((model) => ({ ...model, tags: [...model.tags] })),
		trumboPass: data.trumboPass.map((model) => ({
			...model,
			tags: [...model.tags],
		})),
	};
}

function normalizeModel(raw: unknown): TrumboRecommendedModel | null {
	if (!raw || typeof raw !== "object") return null;
	const data = raw as Record<string, unknown>;
	if (typeof data.id !== "string" || data.id.length === 0) return null;
	const id = publicTrumboModelId(data.id);
	return {
		id,
		name:
			typeof data.name === "string" && data.name.length > 0 ? data.name : id,
		description: typeof data.description === "string" ? data.description : "",
		tags: Array.isArray(data.tags)
			? data.tags.filter((tag): tag is string => typeof tag === "string")
			: [],
	};
}

function publicTrumboModelId(modelId: string): string {
	if (modelId.includes("fireworks") || modelId.startsWith("accounts/")) {
		const leaf = modelId.split("/").filter(Boolean).pop();
		return leaf && leaf.length > 0 ? leaf : modelId;
	}
	return modelId;
}

function normalizeResponse(raw: unknown): TrumboRecommendedModelsData | null {
	if (!raw || typeof raw !== "object") return null;
	const data = raw as Record<string, unknown>;
	const recommendedRaw = Array.isArray(data.recommended)
		? data.recommended
		: [];
	const freeRaw = Array.isArray(data.free) ? data.free : [];
	const trumboRaw = Array.isArray(data.trumbo) ? data.trumbo : [];
	const trumboPassRaw = Array.isArray(data.trumboPass) ? data.trumboPass : [];
	let recommended = recommendedRaw
		.map(normalizeModel)
		.filter((model): model is TrumboRecommendedModel => model !== null);
	const free = freeRaw
		.map(normalizeModel)
		.filter((model): model is TrumboRecommendedModel => model !== null);
	const trumboPass = trumboPassRaw
		.map(normalizeModel)
		.filter((model): model is TrumboRecommendedModel => model !== null);

	// Self-hosted web app returns { trumbo: [...] }.
	if (recommended.length === 0 && free.length === 0 && trumboRaw.length > 0) {
		const trumboModels = trumboRaw
			.map(normalizeModel)
			.filter((model): model is TrumboRecommendedModel => model !== null);
		recommended = trumboModels.slice(0, MAX_FEATURED_TRUMBO_MODELS);
	}

	if (
		recommended.length === 0 &&
		free.length === 0 &&
		trumboPass.length === 0
	) {
		return null;
	}

	return { recommended, free, trumboPass };
}

function getConfiguredApiBaseUrl(
	options: FetchTrumboRecommendedModelsOptions,
): string {
	if (options.baseUrl?.trim()) {
		return resolveTrumboApiBaseUrl(options.baseUrl);
	}
	try {
		const manager =
			options.providerSettingsManager ?? new ProviderSettingsManager();
		const settings = manager.getProviderSettings("trumbo");
		return resolveTrumboApiBaseUrl(settings?.baseUrl);
	} catch {
		return resolveTrumboApiBaseUrl();
	}
}

function usesSelfHostedFallback(apiBaseUrl: string): boolean {
	if (resolveTrumboEnvironment() === "local") {
		return true;
	}
	if (isUnconfiguredTrumboUrl(apiBaseUrl)) {
		return true;
	}
	const lower = apiBaseUrl.toLowerCase();
	return lower.includes("localhost") || lower.includes("127.0.0.1");
}

function resolveFallbackModels(
	apiBaseUrl: string,
): TrumboRecommendedModelsData {
	if (usesSelfHostedFallback(apiBaseUrl)) {
		return cloneRecommendedModels(SELF_HOSTED_TRUMBO_RECOMMENDED_MODELS);
	}
	return cloneRecommendedModels(FALLBACK_TRUMBO_RECOMMENDED_MODELS);
}

async function fetchWithTimeout(
	fetchImpl: typeof fetch,
	input: string,
	timeoutMs: number,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetchImpl(input, { signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

export function buildTrumboRecommendedModelsFromKnownModels(
	knownModels:
		| Record<string, { name?: string; description?: string }>
		| undefined,
): TrumboRecommendedModelsData | null {
	const entries = Object.entries(knownModels ?? {}).filter(
		([id]) => id.trim().length > 0,
	);
	if (entries.length === 0) {
		return null;
	}
	return {
		recommended: entries
			.slice(0, MAX_FEATURED_TRUMBO_MODELS)
			.map(([id, info]) => ({
				id: publicTrumboModelId(id),
				name: info.name?.trim() || publicTrumboModelId(id),
				description: info.description?.trim() ?? "",
				tags: [],
			})),
		free: [],
		trumboPass: [],
	};
}

export async function fetchTrumboRecommendedModels(
	options: FetchTrumboRecommendedModelsOptions = {},
): Promise<TrumboRecommendedModelsData> {
	const apiBaseUrl = getConfiguredApiBaseUrl(options);
	try {
		const fetchImpl = options.fetchImpl ?? fetch;
		const resp = await fetchWithTimeout(
			fetchImpl,
			`${apiBaseUrl}/api/v1/ai/trumbo/recommended-models`,
			options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
		);
		if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
		const json: unknown = await resp.json();
		const data = normalizeResponse(json);
		if (data) return data;
	} catch {
		// Fall back when the remote source is unavailable.
	}

	return resolveFallbackModels(apiBaseUrl);
}
