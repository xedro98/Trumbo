/**
 * OpenTUI probes Kitty graphics support during startup. In some terminals that
 * probe response can leak into the visible CLI as text like:
 * Gi=31337, s=1, v=1, a=q, t=d, f=24; AAAA
 *
 * Disable only the Kitty graphics capability probe that produces the leaked
 * response. Mouse click handling stays enabled; see
 * `resolveOpenTuiMouseMovement()` for Windows movement-reporting behavior.
 */
export function disableOpenTuiGraphicsProbe(): void {
	process.env.OPENTUI_GRAPHICS = "0";
}

/**
 * Windows ConPTY can echo SGR mouse-movement sequences back into stdin. OpenTUI
 * then treats those CSI strings as printable text in focused inputs.
 *
 * Keep movement reporting on other platforms for onboarding robot tracking.
 */
export function resolveOpenTuiMouseMovement(): boolean {
	return process.platform !== "win32";
}
