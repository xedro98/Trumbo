export const TREMBO_RUN_AS_HUB_DAEMON_ENV = "TREMBO_RUN_AS_HUB_DAEMON";

export function isHubDaemonProcess(
	env: Record<string, string | undefined> = process.env,
): boolean {
	return env[TREMBO_RUN_AS_HUB_DAEMON_ENV] === "1";
}
