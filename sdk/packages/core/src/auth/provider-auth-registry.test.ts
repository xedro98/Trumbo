import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	formatProviderOAuthApiKey,
	getPersistedProviderApiKey,
	getProviderAuthHandler,
	getProviderAuthStorageId,
	isOAuthProvider,
	loginAndSaveProviderOAuthCredentials,
	resolveProviderApiKeyFromSettings,
} from "./provider-auth-registry";

const { loginTremboOAuth } = vi.hoisted(() => ({
	loginTremboOAuth: vi.fn(),
}));

vi.mock("./trembo", () => ({
	getValidTremboCredentials: vi.fn(),
	loginTremboOAuth,
}));

vi.mock("./oca", () => ({
	getValidOcaCredentials: vi.fn(),
	loginOcaOAuth: vi.fn(),
}));

vi.mock("./codex", () => ({
	getValidOpenAICodexCredentials: vi.fn(),
	loginOpenAICodex: vi.fn(),
}));

describe("provider auth registry", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns handlers for managed OAuth providers only", () => {
		expect(getProviderAuthHandler("trembo")?.providerId).toBe("trembo");
		expect(getProviderAuthHandler("trembo-pass")?.providerId).toBe("trembo-pass");
		expect(getProviderAuthHandler("oca")?.providerId).toBe("oca");
		expect(getProviderAuthHandler("openai-codex")?.providerId).toBe(
			"openai-codex",
		);
		expect(getProviderAuthHandler("openai-codex-cli")).toBeUndefined();
		expect(isOAuthProvider("openai-codex-cli")).toBe(false);
	});

	it("returns storage provider IDs from handlers", () => {
		expect(getProviderAuthStorageId("trembo")).toBe("trembo");
		expect(getProviderAuthStorageId("trembo-pass")).toBe("trembo");
		expect(getProviderAuthStorageId("oca")).toBe("oca");
		expect(getProviderAuthStorageId("openai-codex")).toBe("openai-codex");
		expect(getProviderAuthStorageId("openai-codex-cli")).toBeUndefined();
	});

	it("formats Trembo WorkOS tokens without double-prefixing", () => {
		expect(formatProviderOAuthApiKey("trembo", { access: "abc" })).toBe(
			"workos:abc",
		);
		expect(formatProviderOAuthApiKey("trembo-pass", { access: "abc" })).toBe(
			"workos:abc",
		);
		expect(formatProviderOAuthApiKey("trembo", { access: "workos:abc" })).toBe(
			"workos:abc",
		);
		expect(
			getPersistedProviderApiKey("trembo-pass", {
				provider: "trembo",
				auth: { accessToken: "abc" },
			}),
		).toBe("workos:abc");
	});

	it("login/save for TremboPass stores credentials under Trembo storage", async () => {
		loginTremboOAuth.mockResolvedValueOnce({
			access: "new-access",
			refresh: "new-refresh",
			expires: 4_000_000_000_000,
			accountId: "acct-new",
		});
		const getProviderSettings = vi.fn().mockReturnValue({
			provider: "trembo",
			apiKey: "manual-key",
		});
		const saveProviderSettings = vi.fn();
		const manager = {
			getProviderSettings,
			saveProviderSettings,
		} as never;

		const saved = await loginAndSaveProviderOAuthCredentials(
			manager,
			"trembo-pass",
			{
				callbacks: {
					onAuth: vi.fn(),
					onPrompt: vi.fn(async () => ""),
				},
			},
		);

		expect(getProviderSettings).toHaveBeenCalledWith("trembo");
		expect(saved).toMatchObject({
			provider: "trembo",
			apiKey: "manual-key",
			auth: {
				accessToken: "workos:new-access",
				refreshToken: "new-refresh",
				accountId: "acct-new",
				expiresAt: 4_000_000_000_000,
			},
		});
		expect(saveProviderSettings).toHaveBeenCalledWith(
			expect.objectContaining({ provider: "trembo" }),
			{ tokenSource: "oauth" },
		);
	});

	it("TremboPass resolves API keys from Trembo storage", () => {
		const getProviderSettings = vi.fn().mockReturnValue({
			provider: "trembo",
			auth: { accessToken: "abc" },
		});
		const manager = { getProviderSettings } as never;

		expect(resolveProviderApiKeyFromSettings(manager, "trembo-pass")).toBe(
			"workos:abc",
		);
		expect(getProviderSettings).toHaveBeenCalledWith("trembo");
	});

	it("login/save stores credentials under handler storageProviderId", async () => {
		loginTremboOAuth.mockResolvedValueOnce({
			access: "new-access",
			refresh: "new-refresh",
			expires: 4_000_000_000_000,
			accountId: "acct-new",
		});
		const getProviderSettings = vi.fn().mockReturnValue({
			provider: "trembo",
			apiKey: "manual-key",
		});
		const saveProviderSettings = vi.fn();
		const manager = {
			getProviderSettings,
			saveProviderSettings,
		} as never;

		const saved = await loginAndSaveProviderOAuthCredentials(manager, "trembo", {
			callbacks: {
				onAuth: vi.fn(),
				onPrompt: vi.fn(async () => ""),
			},
		});

		expect(getProviderSettings).toHaveBeenCalledWith("trembo");
		expect(saved).toMatchObject({
			provider: "trembo",
			apiKey: "manual-key",
			auth: {
				accessToken: "workos:new-access",
				refreshToken: "new-refresh",
				accountId: "acct-new",
				expiresAt: 4_000_000_000_000,
			},
		});
		expect(saveProviderSettings).toHaveBeenCalledWith(
			expect.objectContaining({ provider: "trembo" }),
			{ tokenSource: "oauth" },
		);
	});
});
