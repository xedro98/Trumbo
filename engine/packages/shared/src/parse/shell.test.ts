import { describe, expect, it } from "vitest";
import { getDefaultShell, getShellArgs, getShellInvocation } from "./shell";

describe("shell helpers", () => {
	it("selects PowerShell on Windows and bash elsewhere", () => {
		expect(getDefaultShell("win32")).toBe("powershell");
		expect(getDefaultShell("darwin")).toBe("/bin/bash");
		expect(getDefaultShell("linux")).toBe("/bin/bash");
	});

	it("uses PowerShell flags for PowerShell executables", () => {
		expect(getShellArgs("powershell", "Write-Output 'hi'")).toEqual([
			"-NoProfile",
			"-NonInteractive",
			"-Command",
			"Write-Output 'hi'",
		]);
		expect(
			getShellArgs(
				"C:\\Program Files\\PowerShell\\7\\pwsh.exe",
				"Write-Output 'hi'",
			),
		).toEqual([
			"-NoProfile",
			"-NonInteractive",
			"-Command",
			"Write-Output 'hi'",
		]);
	});

	it("uses cmd flags for cmd.exe", () => {
		expect(getShellArgs("cmd.exe", "echo hello")).toEqual([
			"/d",
			"/s",
			"/c",
			"echo hello",
		]);
	});

	it("uses POSIX flags for bash-like shells", () => {
		expect(getShellArgs("/bin/bash", "echo hi")).toEqual(["-c", "echo hi"]);
		expect(
			getShellArgs("C:\\Program Files\\Git\\bin\\bash.exe", "echo hi"),
		).toEqual(["-c", "echo hi"]);
	});

	it("pipes PowerShell commands via stdin instead of the command line", () => {
		expect(getShellInvocation("pwsh", "Write-Output 'hi'")).toEqual({
			args: ["-NoProfile", "-NonInteractive", "-Command", "-"],
			stdin: "Write-Output 'hi'",
		});
		expect(
			getShellInvocation(
				"C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe",
				"dir",
			),
		).toEqual({
			args: ["-NoProfile", "-NonInteractive", "-Command", "-"],
			stdin: "dir",
		});
	});

	it("keeps cmd.exe on the /c form (no stdin-script mode)", () => {
		expect(getShellInvocation("cmd.exe", "echo hello")).toEqual({
			args: ["/d", "/s", "/c", "echo hello"],
		});
	});

	it("reads bash scripts from stdin", () => {
		expect(getShellInvocation("/bin/bash", "echo hi")).toEqual({
			args: ["--noprofile", "--norc", "-s"],
			stdin: "echo hi",
		});
		// Git Bash on Windows presents as bash.exe — also matched.
		expect(
			getShellInvocation("C:\\Program Files\\Git\\bin\\bash.exe", "echo hi"),
		).toEqual({
			args: ["--noprofile", "--norc", "-s"],
			stdin: "echo hi",
		});
		expect(getShellInvocation("/bin/sh", "echo hi")).toEqual({
			args: ["-s"],
			stdin: "echo hi",
		});
	});
});
