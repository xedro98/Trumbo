import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
	getPersistedProviderApiKey,
	isOAuthProvider,
	ProviderSettingsManager,
	saveLocalProviderSettings,
} from "@trumbo/core";
import { setHomeDir, setTrumboDir } from "@trumbo/shared/storage";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isProviderSettingsUsable } from "../../../utils/provider-readiness";

/**
 * Reproduces the CLI restart persistence flow end-to-end against the REAL
 * ProviderSettingsManager (no mocks), using the same default config-dir
 * resolution the CLI uses (setTrumboDir + setHomeDir, no
 * TRUMBO_PROVIDER_SETTINGS_PATH override).
 *
 * Mirrors:
 *  - onboarding `saveByoConfig` -> saveLocalProviderSettings (apiKey)
 *  - onboarding `completeModelSelection` -> saveProviderSettings (model, setLastUsed)
 *  - restart `main.ts` -> getLastUsedProviderSettings({ isTrumboPassEnabled: false })
 *  - restart `isProviderConfigured` -> isProviderSettingsUsable
 */
describe("CLI provider config persistence across restarts (smoke)", () => {
	const originalEnv = { ...process.env };
	let tempHome: string;

	beforeEach(() => {
		tempHome = mkdtempSync(path.join(os.tmpdir(), "trumbo-persist-"));
		// Wipe path overrides so resolveProviderSettingsPath() falls back to the
		// dynamic TRUMBO_DIR / HOME_DIR resolver (the real CLI default path).
		delete process.env.TRUMBO_PROVIDER_SETTINGS_PATH;
		delete process.env.TRUMBO_DATA_DIR;
		delete process.env.TRUMBO_DIR;
		setHomeDir(tempHome);
		setTrumboDir(path.join(tempHome, ".trumbo"));
	});

	afterEach(() => {
		for (const key of Object.keys(process.env)) {
			if (!(key in originalEnv)) delete process.env[key];
		}
		for (const [key, value] of Object.entries(originalEnv)) {
			process.env[key] = value;
		}
		rmSync(tempHome, { recursive: true, force: true });
	});

	it("survives a BYO provider + API key + model roundtrip", () => {
		// --- First run: onboarding saves provider + key + model ---
		const firstRun = new ProviderSettingsManager();

		// saveByoConfig path: persist the API key (setLastUsed defaults false here).
		saveLocalProviderSettings(firstRun, {
			providerId: "anthropic",
			apiKey: "sk-ant-persist-test",
		});

		// completeModelSelection path: persist model + set lastUsedProvider.
		const existing = firstRun.getProviderSettings("anthropic");
		firstRun.saveProviderSettings(
			{
				...(existing ?? { provider: "anthropic" }),
				model: "claude-sonnet-4-6",
			},
			{ setLastUsed: true },
		);

		// --- Restart: a brand new manager reads from disk ---
		const restart = new ProviderSettingsManager();

		const lastUsed = restart.getLastUsedProviderSettings({
			isTrumboPassEnabled: false,
		});
		expect(lastUsed?.provider).toBe("anthropic");

		const settings = restart.getProviderSettings("anthropic");
		expect(settings?.apiKey).toBe("sk-ant-persist-test");
		expect(settings?.model).toBe("claude-sonnet-4-6");

		const persistedKey = getPersistedProviderApiKey("anthropic", settings);
		expect(persistedKey).toBe("sk-ant-persist-test");
		expect(isOAuthProvider("anthropic")).toBe(false);

		const providerConfig = restart.getProviderConfig("anthropic", {
			includeKnownModels: false,
		});
		expect(
			isProviderSettingsUsable("anthropic", settings, providerConfig),
		).toBe(true);
	});
});
