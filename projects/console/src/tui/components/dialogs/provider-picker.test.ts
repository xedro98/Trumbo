import { describe, expect, it } from "vitest";
import { buildTrumboPassSubscriptionPageUrl } from "./provider-picker-helpers";

describe("buildTrumboPassSubscriptionPageUrl", () => {
	it("opens the personal subscription page on production by default", () => {
		expect(buildTrumboPassSubscriptionPageUrl(undefined)).toBe(
			"http://0.0.0.0:0/dashboard/subscription?personal=true&code=CLI-8OFF",
		);
	});

	it("keeps the configured app base URL", () => {
		expect(buildTrumboPassSubscriptionPageUrl("http://127.0.0.1:9999")).toBe(
			"http://127.0.0.1:9999/dashboard/subscription?personal=true&code=CLI-8OFF",
		);
	});
});
