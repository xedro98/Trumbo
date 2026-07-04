/**
 * OpenTUI probes Kitty graphics support during startup. In some terminals that
 * probe response can leak into the visible CLI as text like:
 * Gi=31337, s=1, v=1, a=q, t=d, f=24; AAAA
 *
 * Disable only the Kitty graphics capability probe that produces the leaked
 * response. See `resolveOpenTuiInputConfig()` for Windows mouse handling.
 */
export function disableOpenTuiGraphicsProbe(): void {
	process.env.OPENTUI_GRAPHICS = "0";
}

export type OpenTuiInputConfig = {
	useMouse: boolean;
	enableMouseMovement: boolean;
};

/**
 * Windows ConPTY echoes SGR mouse click/move sequences back into stdin. OpenTUI
 * then treats those CSI strings as printable text in focused inputs. Disable all
 * mouse reporting on Windows; macOS/Linux keep clicks + movement for TUI UX.
 */
export function resolveOpenTuiInputConfig(): OpenTuiInputConfig {
	if (process.platform === "win32") {
		return {
			useMouse: false,
			enableMouseMovement: false,
		};
	}
	return {
		useMouse: true,
		enableMouseMovement: true,
	};
}

/** @deprecated Use resolveOpenTuiInputConfig().enableMouseMovement */
export function resolveOpenTuiMouseMovement(): boolean {
	return resolveOpenTuiInputConfig().enableMouseMovement;
}
