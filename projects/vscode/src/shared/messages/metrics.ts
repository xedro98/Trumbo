import { Mode } from "../storage/types"

export interface TrumboMessageModelInfo {
	modelId: string
	providerId: string
	mode: Mode
}

interface TrumboTokensInfo {
	prompt: number // Total input tokens (includes cached + non-cached)
	completion: number // Total output tokens
	cached: number // Subset of prompt_tokens that were cache hits
}

export interface TrumboMessageMetricsInfo {
	tokens?: TrumboTokensInfo
	cost?: number // Monetary cost for this turn
}
