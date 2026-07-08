import type { TrumboMessage } from "@shared/ExtensionMessage"
import { memo } from "react"
import { TrumboAuthStatus } from "@/components/account/TrumboAuthStatus"
import EntitlementError from "@/components/chat/EntitlementError"
import OrgTrumboPassRestrictionError from "@/components/chat/OrgTrumboPassRestrictionError"
import PlanLimitError from "@/components/chat/PlanLimitError"
import SpendLimitError from "@/components/chat/SpendLimitError"
import { Button } from "@/components/ui/button"
import { useTrumboAuth, useTrumboSignIn } from "@/context/TrumboAuthContext"
import { TrumboError, TrumboErrorType } from "../../../../src/services/error/TrumboError"

const _errorColor = "var(--vscode-errorForeground)"

interface ErrorRowProps {
	message: TrumboMessage
	errorType: "error" | "mistake_limit_reached" | "diff_error" | "trumboignore_error"
	apiRequestFailedMessage?: string
	apiReqStreamingFailedMessage?: string
}

const ErrorRow = memo(({ message, errorType, apiRequestFailedMessage, apiReqStreamingFailedMessage }: ErrorRowProps) => {
	const { trumboUser } = useTrumboAuth()
	const rawApiError = apiRequestFailedMessage || apiReqStreamingFailedMessage

	const { isLoginLoading, authStatusMessage, handleSignIn } = useTrumboSignIn()

	const renderErrorContent = () => {
		switch (errorType) {
			case "error":
			case "mistake_limit_reached":
				// Handle API request errors with special error parsing
				if (rawApiError) {
					// FIXME: TrumboError parsing should not be applied to non-Trumbo providers, but it seems we're using trumboErrorMessage below in the default error display
					const trumboError = TrumboError.parse(rawApiError)
					const errorMessage = trumboError?._error?.message || trumboError?.message || rawApiError
					const requestId = trumboError?._error?.request_id
					const providerId = trumboError?.providerId || trumboError?._error?.providerId
					const isTrumboProvider = providerId === "trumbo"
					const errorCode = trumboError?._error?.code

				if (trumboError?.isErrorType(TrumboErrorType.Balance)) {
					if (isTrumboProvider) {
						const errorDetails = trumboError._error?.details
						return (
							<PlanLimitError
								message={
									errorDetails?.message ||
									"You've reached your plan limit. Upgrade your plan to continue."
								}
								requestId={requestId}
								upgradeUrl={errorDetails?.buy_credits_url}
							/>
						)
					}
				}

					if (trumboError?.isErrorType(TrumboErrorType.SpendLimit)) {
						const d = trumboError._error?.details
						return (
							<SpendLimitError
								budgetPeriod={d?.budget_period}
								limitUsd={d?.limit_usd}
								message={d?.message || errorMessage}
								resetsAt={d?.resets_at}
								spentUsd={d?.spent_usd}
							/>
						)
					}

					if (trumboError?.isErrorType(TrumboErrorType.Entitlement)) {
						const detailMessage = trumboError?._error?.details?.message || errorMessage
						return <EntitlementError message={detailMessage} />
					}

				if (trumboError?.isErrorType(TrumboErrorType.OrgTrumboPassRestriction)) {
					return <OrgTrumboPassRestrictionError />
				}

				if (trumboError?.isErrorType(TrumboErrorType.SubscriptionRequired)) {
					const d = trumboError._error?.details
					return (
						<PlanLimitError
							message={d?.message || errorMessage}
							requestId={requestId}
						/>
					)
				}

				if (trumboError?.isErrorType(TrumboErrorType.RateLimit)) {
					const d = trumboError._error?.details
					return (
						<PlanLimitError
							message={errorMessage}
							requestId={requestId}
							window={d?.window}
							used={d?.used}
							limit={d?.limit}
							resetsAtSec={d?.reset_at}
						/>
					)
				}

				if (trumboError?.isErrorType(TrumboErrorType.QuotaExceeded)) {
					// Inference-cap / quota-exceeded is a plan-limit variant: render the
					// same upgrade + retry card as other limit errors instead of bare text.
					const d = trumboError?._error?.details
					const detailMessage = d?.message || errorMessage
					return (
						<PlanLimitError
							message={detailMessage}
							requestId={requestId}
							window={d?.window}
							used={d?.used}
							limit={d?.limit}
							resetsAtSec={d?.reset_at}
						/>
					)
				}

					if (trumboError?.isErrorType(TrumboErrorType.Auth) && isTrumboProvider) {
						return !trumboUser ? (
							// User is using Trumbo provider and is not logged in
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-center rounded border border-neutral-500/30 bg-vscode-editor-background p-6 text-center text-vscode-foreground">
									Whoops looks like you're logged out – click below to sign in
								</div>
								<Button className="w-full" disabled={isLoginLoading} onClick={handleSignIn}>
									Sign in to Trumbo
									{isLoginLoading && (
										<span className="ml-1 animate-spin">
											<span className="codicon codicon-refresh" />
										</span>
									)}
								</Button>
								<TrumboAuthStatus message={authStatusMessage} />
							</div>
						) : (
							// Don't show sign in button after the user has logged in, just ask them to retry
							<div className="mt-4">
								<span className="text-description">(Click "Retry" below)</span>
							</div>
						)
					}

				return (
					<div className="m-0 whitespace-pre-wrap text-error wrap-anywhere flex flex-col gap-3">
						{/* Display the well-formatted error extracted from the TrumboError instance */}

						<header>
							{providerId && <span className="uppercase">[{providerId}] </span>}
							{errorCode && <span>{errorCode}</span>}
							{errorMessage}
							{requestId && <div>Request ID: {requestId}</div>}
						</header>

						{/* Windows Powershell Issue */}
						{errorMessage?.toLowerCase()?.includes("powershell") && (
							<div>
								It seems like you're having Windows PowerShell issues, please see this{" "}
								<a
									className="underline text-inherit"
									href="https://github.com/xedro98/Trumbo/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22">
									troubleshooting guide
								</a>
								.
							</div>
						)}

						{/* Display raw API error if different from parsed error message */}
						{errorMessage !== rawApiError && <div>{rawApiError}</div>}
					</div>
				)
				}

				// Regular error message
				return <p className="m-0 mt-0 whitespace-pre-wrap text-error wrap-anywhere">{message.text}</p>

			case "diff_error":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>The model used search patterns that don't match anything in the file. Retrying...</div>
					</div>
				)

			case "trumboignore_error":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>
							Trumbo tried to access <code>{message.text}</code> which is blocked by the <code>.trumboignore</code>
							file.
						</div>
					</div>
				)

			default:
				return null
		}
	}

	// For diff_error and trumboignore_error, we don't show the header separately
	if (errorType === "diff_error" || errorType === "trumboignore_error") {
		return renderErrorContent()
	}

	// For other error types, show header + content
	return renderErrorContent()
})

export default ErrorRow
