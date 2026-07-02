import { describe, expect, it } from "vitest";
import { buildTremboPassSubscriptionPageUrl } from "./provider-picker-helpers";

describe("buildTremboPassSubscriptionPageUrl", () => {
	it("opens the personal subscription page on production by default", () => {
		expect(buildTremboPassSubscriptionPageUrl(undefined)).toBe(
			"http://0.0.0.0:0/dashboard/subscription?personal=true&code=CLI-8OFF",
		);
	});

	it("keeps the configured app base URL", () => {
		expect(
			buildTremboPassSubscriptionPageUrl("http://127.0.0.1:9999"),
		).toBe(
			"http://127.0.0.1:9999/dashboard/subscription?personal=true&code=CLI-8OFF",
		);
	});
});
