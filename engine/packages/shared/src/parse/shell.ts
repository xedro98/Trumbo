function normalizeShellName(shell: string): string {
	const normalizedPath = shell.replaceAll("\\", "/");
	const lastSeparatorIndex = normalizedPath.lastIndexOf("/");
	const baseName =
		lastSeparatorIndex >= 0
			? normalizedPath.slice(lastSeparatorIndex + 1)
			: normalizedPath;
	return baseName.toLowerCase();
}

export function getDefaultShell(platform: string): string {
	return platform === "win32" ? "powershell" : "/bin/bash";
}

export function getShellArgs(shell: string, command: string): string[] {
	const shellName = normalizeShellName(shell);

	if (
		shellName === "powershell" ||
		shellName === "powershell.exe" ||
		shellName === "pwsh" ||
		shellName === "pwsh.exe"
	) {
		return ["-NoProfile", "-NonInteractive", "-Command", command];
	}

	if (shellName === "cmd" || shellName === "cmd.exe") {
		return ["/d", "/s", "/c", command];
	}

	return ["-c", command];
}

export interface ShellInvocation {
	args: string[];
	/**
	 * Command text to write to the process's stdin. When present the shell reads
	 * its script from stdin (`pwsh -Command -`, `bash --noprofile --norc -s`)
	 * instead of receiving it as a CLI argument. This keeps the script text off
	 * the OS command line, which avoids argv-length limits and quoting/escaping
	 * bugs for long or special-character commands.
	 */
	stdin?: string;
}

/**
 * Invocation for a shell that prefers reading the command from stdin.
 * Mirrors `getShellArgs`'s shell detection, but pipes the script via stdin for
 * shells that support it (PowerShell, bash, other POSIX shells). `cmd.exe` has
 * no usable stdin-script mode, so it keeps the `/d /s /c <command>` form.
 */
export function getShellInvocation(
	shell: string,
	command: string,
): ShellInvocation {
	const shellName = normalizeShellName(shell);

	if (
		shellName === "powershell" ||
		shellName === "powershell.exe" ||
		shellName === "pwsh" ||
		shellName === "pwsh.exe"
	) {
		return {
			args: ["-NoProfile", "-NonInteractive", "-Command", "-"],
			stdin: command,
		};
	}

	if (shellName === "cmd" || shellName === "cmd.exe") {
		return { args: ["/d", "/s", "/c", command] };
	}

	const isBash = shellName === "bash" || shellName.startsWith("bash");
	if (isBash || shellName === "sh") {
		// `-s` tells bash/sh to read the script from stdin.
		return isBash
			? { args: ["--noprofile", "--norc", "-s"], stdin: command }
			: { args: ["-s"], stdin: command };
	}

	return { args: ["-c", command] };
}
