import { describe, expect, it } from "vitest";
import { buildTremboPassSubscriptionPageUrl } from "./provider-picker-helpers";

describe("buildTremboPassSubscriptionPageUrl", () => {
	it("opens the personal subscription page on production by default", () => {
		expect(buildTremboPassSubscriptionPageUrl(undefined)).toBe(
			"https://app.trembo.bot/dashboard/subscription?personal=true&code=CLI-8OFF",
		);
	});

	it("keeps the configured app base URL", () => {
		expect(
			buildTremboPassSubscriptionPageUrl("https://staging-app.trembo.bot"),
		).toBe(
			"https://staging-app.trembo.bot/dashboard/subscription?personal=true&code=CLI-8OFF",
		);
	});
});
