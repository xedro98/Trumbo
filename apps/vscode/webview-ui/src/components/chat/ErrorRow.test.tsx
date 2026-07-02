import type { TremboMessage } from "@shared/ExtensionMessage"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import ErrorRow from "./ErrorRow"

const mockSetUserOrganization = vi.hoisted(() => vi.fn())

// Mock the auth context
vi.mock("@/context/TremboAuthContext", () => ({
	useTremboAuth: () => ({
		tremboUser: null,
	}),
	useTremboSignIn: () => ({
		isLoginLoading: false,
	}),
	handleSignOut: vi.fn(),
}))

// Mock CreditLimitError component
vi.mock("@/components/chat/CreditLimitError", () => ({
	default: ({ message }: { message: string }) => <div data-testid="credit-limit-error">{message}</div>,
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

// Mock TremboError
vi.mock("../../../../src/services/error/TremboError", () => ({
	TremboError: {
		parse: vi.fn(),
	},
	TremboErrorType: {
		Balance: "balance",
		RateLimit: "rateLimit",
		Auth: "auth",
		Entitlement: "entitlement",
		OrgTremboPassRestriction: "orgTremboPassRestriction",
		QuotaExceeded: "quotaExceeded",
	},
}))

describe("ErrorRow", () => {
	const mockMessage: TremboMessage = {
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

	it("renders tremboignore error", () => {
		const tremboignoreMessage = { ...mockMessage, text: "/path/to/file.txt" }
		render(<ErrorRow errorType="tremboignore_error" message={tremboignoreMessage} />)

		expect(screen.getByText(/Trembo tried to access/)).toBeInTheDocument()
		expect(screen.getByText("/path/to/file.txt")).toBeInTheDocument()
	})

	describe("API error handling", () => {
		it("renders credit limit error when balance error is detected", async () => {
			const mockTremboError = {
				message: "Insufficient credits",
				isErrorType: vi.fn((type) => type === "balance"),
				_error: {
					details: {
						current_balance: 0,
						total_spent: 10.5,
						total_promotions: 5.0,
						message: "You have run out of credits.",
						buy_credits_url: "http://0.0.0.0:0/dashboard",
					},
				},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage="Insufficient credits error" errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("credit-limit-error")).toBeInTheDocument()
			expect(screen.getByText("You have run out of credits.")).toBeInTheDocument()
		})

		it("does not show Trembo credits CTA for non-Trembo balance errors without a provider URL", async () => {
			const mockTremboError = {
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

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage="Insufficient credits error" errorType="error" message={mockMessage} />)

			expect(screen.queryByTestId("credit-limit-error")).not.toBeInTheDocument()
			expect(screen.getByText(/\[zai\]/)).toBeInTheDocument()
		})

		it("renders rate limit error with request ID", async () => {
			const mockTremboError = {
				message: "Rate limit exceeded",
				isErrorType: vi.fn((type) => type === "rateLimit"),
				_error: {
					request_id: "req_123456",
				},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage="Rate limit exceeded" errorType="error" message={mockMessage} />)

			expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument()
			expect(screen.getByText("Request ID: req_123456")).toBeInTheDocument()
		})

		it("renders quota exceeded error", async () => {
			const mockTremboError = {
				message: "Inference cap reached",
				isErrorType: vi.fn((type) => type === "quotaexceeded"),
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage="The message" errorType="error" message="" />)
			expect(screen.getByText("Inference cap reached")).toBeInTheDocument()
		})

		it("renders entitlement error when TremboError detects TremboNotSubscribedError", async () => {
			const cliMessage =
				"No access to TremboPass subscription models yet. Subscribe to TremboPass, the low cost open weights model coding plan: http://0.0.0.0:0/promo?code=CLI-8OFF&personal=true"
			const mockTremboError = {
				message: cliMessage,
				isErrorType: vi.fn((type) => type === "entitlement"),
				providerId: "trembo-pass",
				_error: {
					message: cliMessage,
				},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage={cliMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("entitlement-error")).toBeInTheDocument()
			expect(screen.getByText(cliMessage)).toBeInTheDocument()
			expect(screen.queryByText(/\[trembo-pass\]/i)).not.toBeInTheDocument()
		})

		it("renders entitlement error when TremboError detects a raw required-plan message", async () => {
			const rawMessage = "403 Error 403: the user is not subscribed to required model plan"
			const mockTremboError = {
				message: rawMessage,
				isErrorType: vi.fn((type) => type === "entitlement"),
				providerId: "trembo-pass",
				_error: {
					message: rawMessage,
				},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage={rawMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("entitlement-error")).toBeInTheDocument()
			expect(screen.getByText(rawMessage)).toBeInTheDocument()
		})

		it("renders organization account TremboPass restriction with friendly account switching copy", async () => {
			const rawMessage = "403 Error 403: organization accounts cannot use individual model inference subscriptions"
			const mockTremboError = {
				message: rawMessage,
				isErrorType: vi.fn((type) => type === "orgTremboPassRestriction"),
				providerId: "trembo",
				_error: {
					message: rawMessage,
				},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage={rawMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("org-trembo-pass-restriction-error")).toBeInTheDocument()
			expect(screen.getByText(/Organization accounts cannot use TremboPass subscriptions/)).toBeInTheDocument()
			expect(screen.queryByText(rawMessage)).not.toBeInTheDocument()

			fireEvent.click(screen.getByText("Switch to personal account"))

			await waitFor(() => expect(mockSetUserOrganization).toHaveBeenCalledWith({}))
			expect(screen.getByText("Switched to personal account")).toBeInTheDocument()
		})

		it("renders organization TremboPass restriction when TremboError detects the SDK formatted message", async () => {
			const formattedMessage =
				"Organization accounts cannot use TremboPass subscriptions. Go to /account -> change account to switch to your personal account for TremboPass"
			const mockTremboError = {
				message: formattedMessage,
				isErrorType: vi.fn((type) => type === "orgTremboPassRestriction"),
				providerId: "trembo-pass",
				_error: {
					message: formattedMessage,
				},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage={formattedMessage} errorType="error" message={mockMessage} />)

			expect(screen.getByTestId("org-trembo-pass-restriction-error")).toBeInTheDocument()
			expect(screen.queryByText(formattedMessage)).not.toBeInTheDocument()
		})

		it("renders friendly logged-out message and sign in button when user is not signed in", async () => {
			const mockTremboError = {
				message: "Authentication failed",
				isErrorType: vi.fn((type) => type === "auth"),
				providerId: "trembo",
				_error: {},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiRequestFailedMessage="Authentication failed" errorType="error" message={mockMessage} />)

			expect(screen.queryByText("Authentication failed")).not.toBeInTheDocument()
			expect(screen.getByText(/Whoops looks like you're logged out/)).toBeInTheDocument()
			expect(screen.getByText("Sign in to Trembo")).toBeInTheDocument()
		})

		it("renders PowerShell troubleshooting link when error mentions PowerShell", async () => {
			const mockTremboError = {
				message: "PowerShell is not recognized as an internal or external command",
				isErrorType: vi.fn(() => false),
				_error: {},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

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
				"https://github.com/trembo/trembo/wiki/TroubleShooting-%E2%80%90-%22PowerShell-is-not-recognized-as-an-internal-or-external-command%22",
			)
		})

		it("handles apiReqStreamingFailedMessage instead of apiRequestFailedMessage", async () => {
			const mockTremboError = {
				message: "Streaming failed",
				isErrorType: vi.fn(() => false),
				_error: {},
			}

			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(mockTremboError as any)

			render(<ErrorRow apiReqStreamingFailedMessage="Streaming failed" errorType="error" message={mockMessage} />)

			expect(screen.getByText("Streaming failed")).toBeInTheDocument()
		})

		it("falls back to regular error message when TremboError.parse returns null", async () => {
			const { TremboError } = await import("../../../../src/services/error/TremboError")
			vi.mocked(TremboError.parse).mockReturnValue(undefined)

			render(<ErrorRow apiRequestFailedMessage="Some API error" errorType="error" message={mockMessage} />)

			// When TremboError.parse returns null, we display the raw error message for non-Trembo providers
			// Since tremboError is undefined, isTremboProvider is false, so we show the raw apiRequestFailedMessage
			expect(screen.getByText("Some API error")).toBeInTheDocument()
		})

		it("renders regular error message when no API error messages are provided", () => {
			render(<ErrorRow errorType="error" message={mockMessage} />)

			expect(screen.getByText("Test error message")).toBeInTheDocument()
		})
	})
})
