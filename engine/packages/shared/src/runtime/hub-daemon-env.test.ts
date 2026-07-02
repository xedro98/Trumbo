import { describe, expect, it } from "vitest";
import {
	isHubDaemonProcess,
	TRUMBO_RUN_AS_HUB_DAEMON_ENV,
} from "./hub-daemon-env";

describe("hub daemon environment helpers", () => {
	it("detects hub daemon mode from the shared sentinel", () => {
		expect(
			isHubDaemonProcess({
				[TRUMBO_RUN_AS_HUB_DAEMON_ENV]: "1",
			}),
		).toBe(true);
		expect(
			isHubDaemonProcess({
				[TRUMBO_RUN_AS_HUB_DAEMON_ENV]: "0",
			}),
		).toBe(false);
	});
});
