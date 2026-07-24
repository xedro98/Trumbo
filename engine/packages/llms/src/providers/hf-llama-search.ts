/**
 * Hugging Face model search for llama models.
 *
 * Fetches model listings from the Hugging Face Hub API so users can discover
 * and select llama models for local inference (llama.cpp, Ollama). The search
 * is debounced by the caller (the model picker) to avoid excessive API calls.
 */

export interface HuggingFaceModelSearchResult {
	/** Fully-qualified model id, e.g. "meta-llama/Llama-3.3-70B-Instruct". */
	id: string;
	/** Display name (defaults to the id). */
	name: string;
	/** Download count for sorting by popularity. */
	downloads?: number;
	/** Like count for sorting by community interest. */
	likes?: number;
	/** Model tags (framework, license, etc.). */
	tags?: string[];
}

const HF_API_BASE = "https://huggingface.co/api/models";
const DEFAULT_LIMIT = 50;

/**
 * Search the Hugging Face Hub for models matching the query. When the query
 * contains "llama", the search is filtered to llama-family models.
 *
 * @returns Array of model results, or an empty array on failure (never throws
 *   — search failures are non-fatal so the picker keeps working with cached
 *   catalog entries).
 */
export async function searchHuggingFaceModels(
	query: string,
	limit = DEFAULT_LIMIT,
): Promise<HuggingFaceModelSearchResult[]> {
	const trimmed = query.trim();
	if (!trimmed) {
		return [];
	}
	const params = new URLSearchParams({
		search: trimmed,
		limit: String(limit),
	});
	// Prefer llama-family results when the query suggests the user is looking
	// for llama models.
	if (/llama/i.test(trimmed)) {
		params.set("filter", "llama");
	}
	try {
		const response = await fetch(`${HF_API_BASE}?${params.toString()}`, {
			signal: AbortSignal.timeout(10_000),
		});
		if (!response.ok) {
			return [];
		}
		const data = (await response.json()) as Array<{
			id: string;
			downloads?: number;
			likes?: number;
			tags?: string[];
		}>;
		return data.map((m) => ({
			id: m.id,
			name: m.id,
			downloads: m.downloads,
			likes: m.likes,
			tags: m.tags,
		}));
	} catch {
		// Network errors, timeouts, and parse failures are non-fatal.
		return [];
	}
}
