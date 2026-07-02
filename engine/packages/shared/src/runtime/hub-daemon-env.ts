export const TRUMBO_RUN_AS_HUB_DAEMON_ENV = "TRUMBO_RUN_AS_HUB_DAEMON";

export function isHubDaemonProcess(
	env: Record<string, string | undefined> = process.env,
): boolean {
	return env[TRUMBO_RUN_AS_HUB_DAEMON_ENV] === "1";
}
