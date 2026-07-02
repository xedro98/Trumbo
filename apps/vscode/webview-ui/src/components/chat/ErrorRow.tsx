import type { TremboMessage } from "@shared/ExtensionMessage"
import { memo } from "react"
import { TremboAuthStatus } from "@/components/account/TremboAuthStatus"
import CreditLimitError from "@/components/chat/CreditLimitError"
import EntitlementError from "@/components/chat/EntitlementError"
import OrgTremboPassRestrictionError from "@/components/chat/OrgTremboPassRestrictionError"
import SpendLimitError from "@/components/chat/SpendLimitError"
import { Button } from "@/components/ui/button"
import { useTremboAuth, useTremboSignIn } from "@/context/TremboAuthContext"
import { TremboError, TremboErrorType } from "../../../../src/services/error/TremboError"

const _errorColor = "var(--vscode-errorForeground)"

interface ErrorRowProps {
	message: TremboMessage
	errorType: "error" | "mistake_limit_reached" | "diff_error" | "tremboignore_error"
	apiRequestFailedMessage?: string
	apiReqStreamingFailedMessage?: string
}

const ErrorRow = memo(({ message, errorType, apiRequestFailedMessage, apiReqStreamingFailedMessage }: ErrorRowProps) => {
	const { tremboUser } = useTremboAuth()
	const rawApiError = apiRequestFailedMessage || apiReqStreamingFailedMessage

	const { isLoginLoading, authStatusMessage, handleSignIn } = useTremboSignIn()

	const renderErrorContent = () => {
		switch (errorType) {
			case "error":
			case "mistake_limit_reached":
				// Handle API request errors with special error parsing
				if (rawApiError) {
					// FIXME: TremboError parsing should not be applied to non-Trembo providers, but it seems we're using tremboErrorMessage below in the default error display
					const tremboError = TremboError.parse(rawApiError)
					const errorMessage = tremboError?._error?.message || tremboError?.message || rawApiError
					const requestId = tremboError?._error?.request_id
					const providerId = tremboError?.providerId || tremboError?._error?.providerId
					const isTremboProvider = providerId === "trembo"
					const errorCode = tremboError?._error?.code

					if (tremboError?.isErrorType(TremboErrorType.Balance)) {
						const errorDetails = tremboError._error?.details
						if (isTremboProvider || errorDetails?.buy_credits_url) {
							return (
								<CreditLimitError
									buyCreditsUrl={errorDetails?.buy_credits_url}
									currentBalance={errorDetails?.current_balance}
									message={errorDetails?.message}
									totalPromotions={errorDetails?.total_promotions}
									totalSpent={errorDetails?.total_spent}
								/>
							)
						}
					}

					if (tremboError?.isErrorType(TremboErrorType.SpendLimit)) {
						const d = tremboError._error?.details
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

					if (tremboError?.isErrorType(TremboErrorType.Entitlement)) {
						const detailMessage = tremboError?._error?.details?.message || errorMessage
						return <EntitlementError message={detailMessage} />
					}

					if (tremboError?.isErrorType(TremboErrorType.OrgTremboPassRestriction)) {
						return <OrgTremboPassRestrictionError />
					}

					if (tremboError?.isErrorType(TremboErrorType.RateLimit)) {
						return (
							<p className="m-0 whitespace-pre-wrap text-error wrap-anywhere">
								{errorMessage}
								{requestId && <div>Request ID: {requestId}</div>}
							</p>
						)
					}

					if (tremboError?.isErrorType(TremboErrorType.QuotaExceeded)) {
						const detailMessage = tremboError?._error?.details?.message || errorMessage
						return <p className="m-0 whitespace-pre-wrap text-error wrap-anywhere">{detailMessage}</p>
					}

					if (tremboError?.isErrorType(TremboErrorType.Auth) && isTremboProvider) {
						return !tremboUser ? (
							// User is using Trembo provider and is not logged in
							<div className="flex flex-col gap-3">
								<div className="flex items-center justify-center rounded border border-neutral-500/30 bg-vscode-editor-background p-6 text-center text-vscode-foreground">
									Whoops looks like you're logged out – click below to sign in
								</div>
								<Button className="w-full" disabled={isLoginLoading} onClick={handleSignIn}>
									Sign in to Trembo
									{isLoginLoading && (
										<span className="ml-1 animate-spin">
											<span className="codicon codicon-refresh" />
										</span>
									)}
								</Button>
								<TremboAuthStatus message={authStatusMessage} />
							</div>
						) : (
							// Don't show sign in button after the user has logged in, just ask them to retry
							<div className="mt-4">
								<span className="text-description">(Click "Retry" below)</span>
							</div>
						)
					}

					return (
						<p className="m-0 whitespace-pre-wrap text-error wrap-anywhere flex flex-col gap-3">
							{/* Display the well-formatted error extracted from the TremboError instance */}

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
										href="https://github.com/trembo/trembo/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22">
										troubleshooting guide
									</a>
									.
								</div>
							)}

							{/* Display raw API error if different from parsed error message */}
							{errorMessage !== rawApiError && <div>{rawApiError}</div>}
						</p>
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

			case "tremboignore_error":
				return (
					<div className="flex flex-col p-2 rounded text-xs opacity-80 bg-quote text-foreground">
						<div>
							Trembo tried to access <code>{message.text}</code> which is blocked by the <code>.tremboignore</code>
							file.
						</div>
					</div>
				)

			default:
				return null
		}
	}

	// For diff_error and tremboignore_error, we don't show the header separately
	if (errorType === "diff_error" || errorType === "tremboignore_error") {
		return renderErrorContent()
	}

	// For other error types, show header + content
	return renderErrorContent()
})

export default ErrorRow
