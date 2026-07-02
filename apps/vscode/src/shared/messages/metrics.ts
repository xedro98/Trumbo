import { Mode } from "../storage/types"

export interface TremboMessageModelInfo {
	modelId: string
	providerId: string
	mode: Mode
}

interface TremboTokensInfo {
	prompt: number // Total input tokens (includes cached + non-cached)
	completion: number // Total output tokens
	cached: number // Subset of prompt_tokens that were cache hits
}

export interface TremboMessageMetricsInfo {
	tokens?: TremboTokensInfo
	cost?: number // Monetary cost for this turn
}
