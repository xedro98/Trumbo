import type { TrumboMessage } from "@shared/ExtensionMessage"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import ErrorRow from "./ErrorRow"

const mockSetUserOrganization = vi.hoisted(() => vi.fn())

// Mock the auth context
vi.mock("@/context/TrumboAuthContext", () => ({
	useTrumboAuth: () => ({
		trumboUser: null,
	}),
	useTrumboSignIn: () => ({
		isLoginLoading: false,
	}),
	handleSignOut: vi.fn(),
}))

// Mock PlanLimitError component (subscription/rate-limit upgrade card)
vi.mock("@/components/chat/PlanLimitError", () => ({
	default: ({ message, requestId }: { message: string; requestId?: string }) => (
		<div data-testid="plan-limit-error">
			{message}
			{requestId && <div>Request ID: {requestId}</div>}
		</div>
	),
}))

// Mock EntitlementError component
vi.mock("@/components/chat/EntitlementError", () => ({
	default: ({ message }: { message: string }) => <div data-testid="entitlement-error">{message}</div>,
}))

vi.mock("@/services/grpc-client", () => ({
	AccountServiceClient: {
		setUserOrganization: mockSetUserOrganization,
	},
}))

// Mock TrumboError
vi.mock("../../../../src/services/error/TrumboError", () => ({
	TrumboError: {
		parse: vi.fn(),
	},
	TrumboErrorType: {
		Balance: "balance",
		RateLimit: "rateLimit",
		Auth: "auth",
		Entitlement: "entitlement",
		OrgTrumboPassRestriction: "orgTrumboPassRestriction",
		QuotaExceeded: "quotaExceeded",
		SubscriptionRequired: "subscriptionRequired",
	},
}))

describe("ErrorRow", () => {
	const mockMessage: TrumboMessage = {
		ts: 123456789,
		type: "say",
		say: "error",
		text: "Test error message",
	}

	beforeEach(() => {
		vi.clearAllMocks()
		mockSetUserOrganization.mockResolvedValue({})
	})

	it("renders basic error message", () => {
		render(<ErrorRow errorType="error" message={mockMessage} />)

		expect(screen.getByText("Test error message")).toBeInTheDocument()
	})

	it("renders mistake limit reached error", () => {
		const mistakeMessage = { ...mockMessage, text: "Mistake limit reached" }
		render(<ErrorRow errorType="mistake_limit_reached" message={mistakeMessage} />)

		expect(screen.getByText("Mistake limit reached")).toBeInTheDocument()
	})

	it("renders diff error", () => {
		render(<ErrorRow errorType="diff_error" message={mockMessage} />)

		expect(
			screen.getByText("The model used search patterns that don't match anything in the file. Retrying..."),
		).toBeInTheDocument()
	})

	it("renders trumboignore error", () => {
		const trumboignoreMessage = { ...mockMessage, text: "/path/to/file.txt" }
		render(<ErrorRow errorType="trumboignore_error" message={trumboignoreMessage} />)

		expect(screen.getByText(/Trumbo tried to access/)).toBeInTheDocument()
		expect(screen.getByText("/path/to/file.txt")).toBeInTheDocument()
	})

	describe("API error handling", () => {
		it("renders plan limit upgrade card when a Trumbo balance error is detected", async () => {
			const mockTrumboError = {
				message: "You've reached your plan limit.",
				providerId: "trumbo",
				isErrorType: vi.fn((type) => type === "balance"),
				_error: {
					providerId: "trumbo",
					details: {
						message: "You've reached your plan limit. Upgrade your plan to continue.",
					},
				},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage="Plan limit error" errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("plan-limit-error")).toBeInTheDocument()
			expect(screen.getByText("You've reached your plan limit. Upgrade your plan to continue.")).toBeInTheDocument()
		})

		it("does not show Trumbo credits CTA for non-Trumbo balance errors without a provider URL", async () => {
			const mockTrumboError = {
				message: "Not enough credits available",
				providerId: "zai",
				isErrorType: vi.fn((type) => type === "balance"),
				_error: {
					code: "insufficient_credits",
					providerId: "zai",
					details: {
						current_balance: 0,
						message: "Not enough credits available",
					},
				},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage="Insufficient credits error" errorType="error" message={mockMessage} />)

			expect(screen.queryByTestId("plan-limit-error")).not.toBeInTheDocument()
			expect(screen.getByText(/\[zai\]/)).toBeInTheDocument()
		})

		it("renders rate limit error with request ID", async () => {
			const mockTrumboError = {
				message: "Rate limit exceeded",
				isErrorType: vi.fn((type) => type === "rateLimit"),
				_error: {
					request_id: "req_123456",
				},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage="Rate limit exceeded" errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("plan-limit-error")).toBeInTheDocument()
			expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument()
			expect(screen.getByText("Request ID: req_123456")).toBeInTheDocument()
		})

		it("renders plan limit upgrade card when subscription_required is detected", async () => {
			const subMessage = "An active paid subscription is required to use the Trumbo provider."
			const mockTrumboError = {
				message: subMessage,
				isErrorType: vi.fn((type) => type === "subscriptionRequired"),
				providerId: "trumbo",
				_error: {
					message: subMessage,
					request_id: "req_sub_001",
				},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage={subMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("plan-limit-error")).toBeInTheDocument()
			expect(screen.getByText(subMessage)).toBeInTheDocument()
			expect(screen.getByText("Request ID: req_sub_001")).toBeInTheDocument()
		})

		it("renders quota exceeded error", async () => {
			const mockTrumboError = {
				message: "Inference cap reached",
				isErrorType: vi.fn((type) => type === "quotaexceeded"),
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage="The message" errorType="error" message="" />)
			expect(screen.getByText("Inference cap reached")).toBeInTheDocument()
		})

		it("renders entitlement error when TrumboError detects TrumboNotSubscribedError", async () => {
			const cliMessage =
				"No access to TrumboPass subscription models yet. Subscribe to TrumboPass, the low cost open weights model coding plan: https://platform.trumbo.dev/promo?code=CLI-8OFF&personal=true"
			const mockTrumboError = {
				message: cliMessage,
				isErrorType: vi.fn((type) => type === "entitlement"),
				providerId: "trumbo-pass",
				_error: {
					message: cliMessage,
				},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage={cliMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("entitlement-error")).toBeInTheDocument()
			expect(screen.getByText(cliMessage)).toBeInTheDocument()
			expect(screen.queryByText(/\[trumbo-pass\]/i)).not.toBeInTheDocument()
		})

		it("renders entitlement error when TrumboError detects a raw required-plan message", async () => {
			const rawMessage = "403 Error 403: the user is not subscribed to required model plan"
			const mockTrumboError = {
				message: rawMessage,
				isErrorType: vi.fn((type) => type === "entitlement"),
				providerId: "trumbo-pass",
				_error: {
					message: rawMessage,
				},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage={rawMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("entitlement-error")).toBeInTheDocument()
			expect(screen.getByText(rawMessage)).toBeInTheDocument()
		})

		it("renders organization account TrumboPass restriction with friendly account switching copy", async () => {
			const rawMessage = "403 Error 403: organization accounts cannot use individual model inference subscriptions"
			const mockTrumboError = {
				message: rawMessage,
				isErrorType: vi.fn((type) => type === "orgTrumboPassRestriction"),
				providerId: "trumbo",
				_error: {
					message: rawMessage,
				},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage={rawMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("org-trumbo-pass-restriction-error")).toBeInTheDocument()
			expect(screen.getByText(/Organization accounts cannot use TrumboPass subscriptions/)).toBeInTheDocument()
			expect(screen.queryByText(rawMessage)).not.toBeInTheDocument()

			fireEvent.click(screen.getByText("Switch to personal account"))

			await waitFor(() => expect(mockSetUserOrganization).toHaveBeenCalledWith({}))
			expect(screen.getByText("Switched to personal account")).toBeInTheDocument()
		})

		it("renders organization TrumboPass restriction when TrumboError detects the SDK formatted message", async () => {
			const formattedMessage =
				"Organization accounts cannot use TrumboPass subscriptions. Go to /account -> change account to switch to your personal account for TrumboPass"
			const mockTrumboError = {
				message: formattedMessage,
				isErrorType: vi.fn((type) => type === "orgTrumboPassRestriction"),
				providerId: "trumbo-pass",
				_error: {
					message: formattedMessage,
				},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage={formattedMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("org-trumbo-pass-restriction-error")).toBeInTheDocument()
			expect(screen.queryByText(formattedMessage)).not.toBeInTheDocument()
		})

		it("renders friendly logged-out message and sign in button when user is not signed in", async () => {
			const mockTrumboError = {
				message: "Authentication failed",
				isErrorType: vi.fn((type) => type === "auth"),
				providerId: "trumbo",
				_error: {},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiRequestFailedMessage="Authentication failed" errorType="error" message={mockMessage} />)

			expect(screen.queryByText("Authentication failed")).not.toBeInTheDocument()
			expect(screen.getByText(/Whoops looks like you're logged out/)).toBeInTheDocument()
			expect(screen.getByText("Sign in to Trumbo")).toBeInTheDocument()
		})

		it("renders PowerShell troubleshooting link when error mentions PowerShell", async () => {
			const mockTrumboError = {
				message: "PowerShell is not recognized as an internal or external command",
				isErrorType: vi.fn(() => false),
				_error: {},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(
				<ErrorRow
					apiRequestFailedMessage="PowerShell is not recognized as an internal or external command"
					errorType="error"
					message={mockMessage}
				/>,
			)

			expect(screen.getByText(/PowerShell is not recognized/)).toBeInTheDocument()
			expect(screen.getByText("troubleshooting guide")).toBeInTheDocument()
			expect(screen.getByRole("link", { name: "troubleshooting guide" })).toHaveAttribute(
				"href",
				"https://github.com/xedro98/Trumbo/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22",
			)
		})

		it("handles apiReqStreamingFailedMessage instead of apiRequestFailedMessage", async () => {
			const mockTrumboError = {
				message: "Streaming failed",
				isErrorType: vi.fn(() => false),
				_error: {},
			}

			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(mockTrumboError as any)

			render(<ErrorRow apiReqStreamingFailedMessage="Streaming failed" errorType="error" message={mockMessage} />)

			expect(screen.getByText("Streaming failed")).toBeInTheDocument()
		})

		it("falls back to regular error message when TrumboError.parse returns null", async () => {
			const { TrumboError } = await import("../../../../src/services/error/TrumboError")
			vi.mocked(TrumboError.parse).mockReturnValue(undefined)

			render(<ErrorRow apiRequestFailedMessage="Some API error" errorType="error" message={mockMessage} />)

			// When TrumboError.parse returns null, we display the raw error message for non-Trumbo providers
			// Since trumboError is undefined, isTrumboProvider is false, so we show the raw apiRequestFailedMessage
			expect(screen.getByText("Some API error")).toBeInTheDocument()
		})

		it("renders regular error message when no API error messages are provided", () => {
			render(<ErrorRow errorType="error" message={mockMessage} />)

			expect(screen.getByText("Test error message")).toBeInTheDocument()
		})
	})
})
