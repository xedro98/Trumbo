import type {
	GatewayProviderContext,
	GatewayResolvedProviderConfig,
} from "@trumbodev/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAnthropicProviderModule } from "./anthropic";

const createAnthropicMock = vi.hoisted(() => vi.fn());
const anthropicModelMock = vi.hoisted(() =>
	vi.fn((modelId: string) => ({ provider: "anthropic", modelId })),
);

vi.mock("@ai-sdk/anthropic", () => ({
	createAnthropic: createAnthropicMock,
}));

describe("createAnthropicProviderModule", () => {
	beforeEach(() => {
		createAnthropicMock.mockReset();
		createAnthropicMock.mockReturnValue(anthropicModelMock);
		anthropicModelMock.mockClear();
	});

	it("passes custom base URLs to Anthropic-compatible providers", async () => {
		const provider = await createAnthropicProviderModule(
			config({
				apiKey: "minimax-api-key",
				baseUrl: "https://api.minimax.io/anthropic",
			}),
			context("minimax"),
		);

		provider.model("MiniMax-M2.5");

		expect(createAnthropicMock).toHaveBeenCalledWith(
			expect.objectContaining({
				apiKey: "minimax-api-key",
				baseURL: "https://api.minimax.io/anthropic",
				name: "minimax",
			}),
		);
		expect(anthropicModelMock).toHaveBeenCalledWith("MiniMax-M2.5");
	});

	it("does not wrap fetch for non-MiniMax Anthropic-compatible providers", async () => {
		const customFetch = vi.fn<typeof fetch>();

		await createAnthropicProviderModule(
			config({
				providerId: "anthropic",
				apiKey: "anthropic-api-key",
				fetch: customFetch,
			}),
			context("anthropic"),
		);

		expect(createAnthropicMock).toHaveBeenCalledWith(
			expect.objectContaining({
				name: "anthropic",
				fetch: customFetch,
			}),
		);
	});

	it("uses ANTHROPIC_BEARER_TOKEN as the Authorization header when set", async () => {
		const previous = process.env.ANTHROPIC_BEARER_TOKEN;
		process.env.ANTHROPIC_BEARER_TOKEN = "test-bearer-token";
		try {
			await createAnthropicProviderModule(
				config({ providerId: "anthropic", apiKey: "anthropic-api-key" }),
				context("anthropic"),
			);

			expect(createAnthropicMock).toHaveBeenCalledWith(
				expect.objectContaining({
					apiKey: "test-bearer-token",
					headers: expect.objectContaining({
						Authorization: "Bearer test-bearer-token",
					}),
				}),
			);
		} finally {
			if (previous === undefined) {
				delete process.env.ANTHROPIC_BEARER_TOKEN;
			} else {
				process.env.ANTHROPIC_BEARER_TOKEN = previous;
			}
		}
	});

	it("does not set Authorization when ANTHROPIC_BEARER_TOKEN is unset", async () => {
		const previous = process.env.ANTHROPIC_BEARER_TOKEN;
		delete process.env.ANTHROPIC_BEARER_TOKEN;
		try {
			await createAnthropicProviderModule(
				config({ providerId: "anthropic", apiKey: "anthropic-api-key" }),
				context("anthropic"),
			);

			const call = createAnthropicMock.mock.calls[0]?.[0] as Record<
				string,
				unknown
			>;
			const headers = call?.headers as Record<string, string> | undefined;
			expect(headers?.Authorization).toBeUndefined();
			expect(call?.apiKey).toBe("anthropic-api-key");
		} finally {
			if (previous === undefined) {
				delete process.env.ANTHROPIC_BEARER_TOKEN;
			} else {
				process.env.ANTHROPIC_BEARER_TOKEN = previous;
			}
		}
	});
});

function config(
	overrides: Partial<GatewayResolvedProviderConfig>,
): GatewayResolvedProviderConfig {
	return {
		providerId: "minimax",
		...overrides,
	};
}

function context(providerId: string): GatewayProviderContext {
	return {
		provider: {
			id: providerId,
			name: "MiniMax",
			defaultModelId: "MiniMax-M2.5",
			models: [],
		},
		model: {
			providerId,
			id: "MiniMax-M2.5",
			name: "MiniMax-M2.5",
		},
		config: config({ providerId }),
	};
}
