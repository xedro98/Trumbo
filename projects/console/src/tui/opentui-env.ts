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

/**
 * Sends terminal escape sequences to disable all mouse reporting modes.
 * Use on startup when useMouse is false, in case a previous trumbo process
 * crashed without disabling mouse mode (leaving the terminal sending SGR
 * mouse sequences on every click).
 */
export function resetTerminalMouseMode(): void {
	try {
		// Disable: SGR mouse (1006), mouse motion (1003), button event (1002),
		// X10 mouse (1000), and all-mouse tracking (any-event).
		const disableSeq =
			"\x1b[?1006l\x1b[?1003l\x1b[?1002l\x1b[?1000l\x1b[?1005l";
		process.stdout.write(disableSeq);
	} catch {
		// Best-effort — if stdout isn't writable, the renderer will handle it.
	}
}
