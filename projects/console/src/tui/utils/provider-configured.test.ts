import { mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import {
	ProviderSettingsManager,
	saveLocalProviderSettings,
} from "@trumbodev/core";
import { setHomeDir, setTrumboDir } from "@trumbodev/shared/storage";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Config } from "../../utils/types";
import { isProviderConfigured } from "./provider-configured";

/**
 * Onboarding gate (`root.tsx` -> `isProviderConfigured(config)`). This decides
 * whether the interactive TUI re-runs the onboarding wizard on startup.
 *
 * Regression: the gate used to delegate to `isProviderSettingsUsable`, which
 * returns false for any bring-your-own-key provider that has a saved model but
 * no persisted `apiKey` (and no base-url field). So a user who completed
 * onboarding and saved a model + reasoning -- but whose `apiKey` didn't make it
 * to disk (never entered, paste failed, or later cleared) -- was re-onboarded on
 * every restart: "the CLI forgets everything."
 *
 * The gate now mirrors the lenient `isProviderConfigured` from
 * `../../utils/provider-auth` (used by the provider picker): a saved model is
 * enough to count as configured; a missing key surfaces as the provider's own
 * auth error at runtime instead of wiping the setup. The first-run default
 * (`trumbo`, OAuth, no access token) must still trigger onboarding.
 */
describe("onboarding gate isProviderConfigured", () => {
	const originalEnv = { ...process.env };
	let tempHome: string;

	beforeEach(() => {
		tempHome = mkdtempSync(path.join(os.tmpdir(), "trumbo-gate-"));
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

	const configFor = (providerId: string, apiKey = "") =>
		({ providerId, apiKey }) as unknown as Config;

	it("treats a BYO provider with a saved model but no api key as configured (no re-onboarding)", () => {
		// Simulate onboarding that saved a model + reasoning but no apiKey:
		// saveByoConfig (no key) -> saveLocalProviderSettings deletes apiKey,
		// completeModelSelection -> saveProviderSettings (model, setLastUsed).
		const manager = new ProviderSettingsManager();
		saveLocalProviderSettings(manager, {
			providerId: "fireworks",
			apiKey: "",
		});
		const existing = manager.getProviderSettings("fireworks");
		manager.saveProviderSettings(
			{
				...(existing ?? { provider: "fireworks" }),
				model: "accounts/fireworks/models/...-reasoning",
				reasoning: { enabled: false },
			},
			{ setLastUsed: true },
		);

		// Restart: in-memory apiKey is empty, but a model was persisted.
		expect(isProviderConfigured(configFor("fireworks"))).toBe(true);
	});

	it("still re-onboards for the first-run default (trumbo, OAuth, no access token)", () => {
		// main.ts first-run save: keyless trumbo with a default model.
		const manager = new ProviderSettingsManager();
		manager.saveProviderSettings(
			{ provider: "trumbo", model: "anthropic/claude-sonnet-4.6" },
			{ setLastUsed: true },
		);

		expect(isProviderConfigured(configFor("trumbo"))).toBe(false);
	});

	it("is configured when an api key was persisted (happy path)", () => {
		const manager = new ProviderSettingsManager();
		saveLocalProviderSettings(manager, {
			providerId: "anthropic",
			apiKey: "sk-ant-persist-test",
		});
		manager.saveProviderSettings(
			{ provider: "anthropic", model: "claude-sonnet-4-6" },
			{ setLastUsed: true },
		);

		expect(isProviderConfigured(configFor("anthropic"))).toBe(true);
	});

	it("is configured when an in-memory apiKey is present (short-circuit)", () => {
		expect(isProviderConfigured(configFor("anthropic", "sk-ant-live"))).toBe(
			true,
		);
	});

	it("re-onboards when nothing is persisted for the provider", () => {
		expect(isProviderConfigured(configFor("anthropic"))).toBe(false);
	});
});
