import { describe, expect, it } from "vitest";
import { buildSkillsArgs } from "./skill";

describe("buildSkillsArgs", () => {
	it("runs the skills package through npx with -y", () => {
		expect(buildSkillsArgs(["list"])).toEqual(["-y", "skills@latest", "list"]);
	});

	it("injects --agent trumbo for install-style subcommands", () => {
		expect(buildSkillsArgs(["install", "owner/repo"])).toEqual([
			"-y",
			"skills@latest",
			"add",
			"owner/repo",
			"--agent",
			"trumbo",
		]);
		expect(buildSkillsArgs(["add", "owner/repo"])).toContain("trumbo");
		expect(buildSkillsArgs(["i", "owner/repo"])).toContain("trumbo");
		expect(buildSkillsArgs(["update", "owner/repo"])).toContain("trumbo");
	});

	it("aliases uninstall to the skills remove subcommand", () => {
		expect(buildSkillsArgs(["uninstall", "my-skill"])).toEqual([
			"-y",
			"skills@latest",
			"remove",
			"my-skill",
			"--agent",
			"trumbo",
		]);
	});

	it("does not inject when the user already targeted an agent", () => {
		expect(
			buildSkillsArgs(["install", "owner/repo", "--agent", "cursor"]),
		).not.toContain("trumbo");
		expect(
			buildSkillsArgs(["install", "owner/repo", "-a", "cursor"]),
		).not.toContain("trumbo");
		expect(
			buildSkillsArgs(["install", "owner/repo", "--agent=cursor"]),
		).not.toContain("trumbo");
	});

	it("aliases install and uninstall when agent options come before the subcommand", () => {
		expect(
			buildSkillsArgs(["--agent", "cursor", "install", "owner/repo"]),
		).toEqual([
			"-y",
			"skills@latest",
			"--agent",
			"cursor",
			"add",
			"owner/repo",
		]);
		expect(
			buildSkillsArgs(["--agent=cursor", "uninstall", "my-skill"]),
		).toEqual(["-y", "skills@latest", "--agent=cursor", "remove", "my-skill"]);
	});

	it("does not scope non-install subcommands to trumbo", () => {
		expect(buildSkillsArgs(["use", "owner/repo"])).not.toContain("--agent");
		expect(buildSkillsArgs(["list"])).not.toContain("--agent");
	});

	it("scopes remove-style subcommands to trumbo", () => {
		expect(buildSkillsArgs(["remove"])).toEqual([
			"-y",
			"skills@latest",
			"remove",
			"--agent",
			"trumbo",
		]);
		expect(buildSkillsArgs(["rm", "my-skill"])).toContain("trumbo");
		expect(buildSkillsArgs(["r", "my-skill"])).toContain("trumbo");
	});

	it("ignores leading flags when detecting the subcommand", () => {
		expect(buildSkillsArgs(["--global", "install", "owner/repo"])).toContain(
			"trumbo",
		);
	});

	it("forwards an empty arg list unchanged", () => {
		expect(buildSkillsArgs([])).toEqual(["-y", "skills@latest"]);
	});
});
