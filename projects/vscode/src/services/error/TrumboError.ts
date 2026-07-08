import {
	getTrumboOrgIndividualInferenceSubscriptionMessage,
	isTrumboNotSubscribedMessage,
	isTrumboOrgIndividualInferenceSubscriptionMessage,
} from "@trumbo/llms"
import { serializeError } from "serialize-error"
import { TRUMBO_ACCOUNT_AUTH_ERROR_MESSAGE } from "../../shared/TrumboAccount"

export enum TrumboErrorType {
	Auth = "auth",
	RateLimit = "rateLimit",
	Balance = "balance",
	SpendLimit = "spendLimit",
	QuotaExceeded = "quotaExceeded",
	Entitlement = "entitlement",
	OrgTrumboPassRestriction = "orgTrumboPassRestriction",
	SubscriptionRequired = "subscriptionRequired",
}

interface ErrorDetails {
	/**
	 * The HTTP status code of the error, if applicable.
	 */
	status?: number
	/**
	 * The request ID associated with the error, if available.
	 * This can be useful for debugging and support.
	 */
	request_id?: string
	/**
	 * Specific error code provided by the API or service.
	 */
	code?: string
	/**
	 * The model ID associated with the error, if applicable.
	 * This is useful for identifying which model the error relates to.
	 */
	modelId?: string
	/**
	 * The provider ID associated with the error, if applicable.
	 * This is useful for identifying which provider the error relates to.
	 */
	providerId?: string
	/**
	 * The error message associated with the error, if applicable.
	 */
	message?: string
	// Additional details that might be present in the error
	// This can include things like current balance, error messages, etc.
	details?: any
}

const RATE_LIMIT_PATTERNS = [/status code 429/i, /rate limit/i, /too many requests/i, /quota exceeded/i, /resource exhausted/i]

export class TrumboError extends Error {
	readonly title = "TrumboError"
	readonly _error: ErrorDetails

	// Error details per providers:
	// Trumbo: error?.error
	// Ollama: error?.cause
	// tbc
	constructor(
		raw: any,
		public readonly modelId?: string,
		public readonly providerId?: string,
	) {
		const error = serializeError(raw)

		const message = error.message || error?.response?.message || String(error) || error?.cause?.means
		super(message)

		// Extract status from multiple possible locations
		const status = error.status || error.statusCode || error.response?.status
		this.modelId = modelId || error.modelId
		this.providerId = providerId || error.providerId

		// Construct the error details object to includes relevant information
		// And ensure it has a consistent structure
		this._error = {
			...error,
			message: raw.message || message,
			status,
			request_id:
				error.error?.request_id ||
				error.request_id ||
				error.response?.request_id ||
				error.response?.headers?.["x-request-id"],
			code: error.code || error?.cause?.code,
			modelId: this.modelId,
			providerId: this.providerId,
			details: error.details || error.error, // Additional details provided by the server
			stack: undefined, // Avoid serializing stack trace to keep the error object clean
		}
	}

	/**
	 *  Serializes the error to a JSON string that allows for easy transmission and storage.
	 *  This is useful for logging or sending error details to a webviews.
	 */
	public serialize(): string {
		return JSON.stringify({
			message: this.message,
			status: this._error.status,
			request_id: this._error.request_id,
			code: this._error.code,
			modelId: this.modelId,
			providerId: this.providerId,
			details: this._error.details,
		})
	}

	public get status(): number | undefined {
		return this._error.status
	}

	public get requestId(): string | undefined {
		return this._error.request_id
	}

	/**
	 * Parses a stringified error into a TrumboError instance.
	 */
	static parse(errorStr?: string, modelId?: string): TrumboError | undefined {
		if (!errorStr || typeof errorStr !== "string") {
			return undefined
		}
		return TrumboError.transform(errorStr, modelId)
	}

	/**
	 * Transforms any object into a TrumboError instance.
	 * Always returns a TrumboError, even if the input is not a valid error object.
	 */
	static transform(error: any, modelId?: string, providerId?: string): TrumboError {
		try {
			// If already a TrumboError, return it directly to prevent infinite recursion
			if (error instanceof TrumboError) {
				return error
			}
			return new TrumboError(JSON.parse(error), modelId, providerId)
		} catch {
			return new TrumboError(error, modelId, providerId)
		}
	}

	public isErrorType(type: TrumboErrorType): boolean {
		return TrumboError.getErrorType(this) === type
	}

	/**
	 * Is known error type based on the error code, status, and details.
	 * This is useful for determining how to handle the error in the UI or logic.
	 */
	static getErrorType(err: TrumboError): TrumboErrorType | undefined {
		const { code, status, details } = err._error
		const rawMessage = err._error?.message || err.message || JSON.stringify(err._error)
		const message = rawMessage?.toLowerCase()
		const detailMessage = typeof details?.message === "string" ? details.message : undefined

		// Check balance error first (most specific)
		if (code === "insufficient_credits" && typeof details?.current_balance === "number") {
			return TrumboErrorType.Balance
		}

		// Check spend limit exceeded (org-enforced budget cap, 429 SPEND_LIMIT_EXCEEDED)
		// Must be checked before the generic rate-limit check since both use 429
		if (code === "SPEND_LIMIT_EXCEEDED" || details?.code === "SPEND_LIMIT_EXCEEDED") {
			return TrumboErrorType.SpendLimit
		}

		if (
			rawMessage === getTrumboOrgIndividualInferenceSubscriptionMessage() ||
			(detailMessage ? isTrumboOrgIndividualInferenceSubscriptionMessage(detailMessage) : false) ||
			(rawMessage ? isTrumboOrgIndividualInferenceSubscriptionMessage(rawMessage) : false)
		) {
			return TrumboErrorType.OrgTrumboPassRestriction
		}

		if (
			(detailMessage ? isTrumboNotSubscribedMessage(detailMessage) : false) ||
			(rawMessage ? isTrumboNotSubscribedMessage(rawMessage) : false)
		) {
			return TrumboErrorType.Entitlement
		}

		// Subscription required: the platform's chat-completion gateway returns
		// 403 `subscription_required` when the user/team has no active paid plan.
		// Must be checked before the generic auth check, since 403 falls in the
		// 400-429 auth-status range and would otherwise be misclassified as Auth.
		if (
			code === "subscription_required" ||
			details?.code === "subscription_required" ||
			(status === 403 && /subscription.*required|required.*subscription|active.*paid.*subscription/i.test(rawMessage))
		) {
			return TrumboErrorType.SubscriptionRequired
		}

		// Check auth errors
		const isAuthStatus = status !== undefined && status > 400 && status < 429
		if (code === "ERR_BAD_REQUEST" || err instanceof AuthInvalidTokenError || isAuthStatus) {
			return TrumboErrorType.Auth
		}

		if (code === "INFERENCE_CAP_ERROR") {
			return TrumboErrorType.QuotaExceeded
		}

		if (message) {
			const lowerMessage = message.toLowerCase()
			// Auth / credential failures: `invalid_grant` (OAuth refresh failure
			// or rejected access token), invalid token/key, unauthorized, expired
			// token, or a re-auth requirement. SubscriptionRequired is already
			// handled above, so a 403 `subscription_required` won't fall through
			// here as Auth.
			const authErrorRegex = [
				/(?:in)?valid[-_ ]?(?:api )?(?:token|key)/i,
				/invalid[-_ ]?grant/i,
				/authentication[-_ ]?failed/i,
				/unauthorized/i,
				/re[-_ ]?auth/i,
				/requires re-authentication/i,
				/expired[-_ ]?token/i,
			]
			const authHint =
				lowerMessage.includes("invalid_grant") ||
				lowerMessage.includes("invalid grant") ||
				lowerMessage.includes("re-auth") ||
				lowerMessage.includes("requires re-authentication")
			if (
				message?.includes(TRUMBO_ACCOUNT_AUTH_ERROR_MESSAGE) ||
				authErrorRegex.some((regex) => regex.test(message)) ||
				authHint
			) {
				return TrumboErrorType.Auth
			}

			// Check rate limit patterns
			if (RATE_LIMIT_PATTERNS.some((pattern) => pattern.test(lowerMessage))) {
				return TrumboErrorType.RateLimit
			}
		}

		return undefined
	}
}

class AuthInvalidTokenError extends Error {
	constructor(message: string) {
		super(message)
		this.name = TrumboErrorType.Auth
	}
}
