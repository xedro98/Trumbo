import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setHomeDir, setTrumboDir } from "@trumbodev/shared/storage";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { uninstallMarketplaceEntry } from "./marketplace";

describe("marketplace service", () => {
	let root = "";
	let home = "";
	let originalHome: string | undefined;
	let originalTrumboDir: string | undefined;

	beforeEach(() => {
		root = mkdtempSync(join(tmpdir(), "core-marketplace-"));
		home = join(root, "home");
		originalHome = process.env.HOME;
		originalTrumboDir = process.env.TRUMBO_DIR;
		process.env.HOME = home;
		process.env.TRUMBO_DIR = join(home, ".trumbo");
		setHomeDir(home);
		setTrumboDir(process.env.TRUMBO_DIR);
	});

	afterEach(() => {
		if (originalHome === undefined) {
			delete process.env.HOME;
		} else {
			process.env.HOME = originalHome;
		}
		if (originalTrumboDir === undefined) {
			delete process.env.TRUMBO_DIR;
		} else {
			process.env.TRUMBO_DIR = originalTrumboDir;
		}
		rmSync(root, { recursive: true, force: true });
	});

	it("uninstalls marketplace MCP servers from settings by default", async () => {
		const settingsPath = join(root, "trumbo_mcp_settings.json");
		await writeFile(
			settingsPath,
			JSON.stringify(
				{
					mcpServers: {
						context7: { transport: { type: "stdio", command: "node" } },
						other: { transport: { type: "stdio", command: "node" } },
					},
				},
				null,
				2,
			),
			"utf8",
		);

		const result = await uninstallMarketplaceEntry(
			{
				id: "context7",
				type: "mcp",
				name: "Context7",
				install: { args: ["context7", "node", "server.js"] },
			},
			{ mcpSettingsPath: settingsPath },
		);

		expect(result).toMatchObject({
			id: "context7",
			type: "mcp",
			status: "uninstalled",
			message: "Uninstalled Context7.",
		});
		const settings = JSON.parse(readFileSync(settingsPath, "utf8")) as {
			mcpServers?: Record<string, unknown>;
		};
		expect(settings.mcpServers?.context7).toBeUndefined();
		expect(settings.mcpServers?.other).toBeDefined();
	});

	it("uninstalls marketplace skills through skills CLI remove", async () => {
		const skillDir = join(home, ".agents", "skills", "review-team");
		await mkdir(skillDir, { recursive: true });
		await writeFile(
			join(skillDir, "SKILL.md"),
			"---\nname: Review\n---\n",
			"utf8",
		);
		const calls: Array<{ command: string; args: string[] }> = [];

		const result = await uninstallMarketplaceEntry(
			{
				id: "review-team",
				type: "skill",
				name: "Review Team",
				install: {
					args: ["github.com/trumbo/skills@review-team"],
				},
			},
			{
				spawnCommand: async (command, args) => {
					calls.push({ command, args });
					rmSync(skillDir, { recursive: true, force: true });
					return { exitCode: 0, stdout: "removed", stderr: "" };
				},
			},
		);

		expect(result).toMatchObject({
			id: "review-team",
			type: "skill",
			status: "uninstalled",
			message: "Uninstalled Review Team.",
		});
		expect(calls).toEqual([
			{
				command: "npx",
				args: ["-y", "skills@latest", "remove", "review-team", "-g", "-y"],
			},
		]);
		expect(existsSync(skillDir)).toBe(false);
	});

	it("cleans up remaining marketplace skill directories after skills CLI remove succeeds", async () => {
		const trumboSkillDir = join(
			process.env.TRUMBO_DIR ?? "",
			"skills",
			"review-team",
		);
		await mkdir(trumboSkillDir, { recursive: true });
		await writeFile(join(trumboSkillDir, "SKILL.md"), "# Review Team", "utf8");

		const result = await uninstallMarketplaceEntry(
			{
				id: "review-team",
				type: "skill",
				name: "Review Team",
				install: { args: ["github.com/trumbo/skills@review-team"] },
			},
			{
				spawnCommand: async () => ({
					exitCode: 0,
					stdout: "removed",
					stderr: "",
				}),
			},
		);

		expect(result.status).toBe("uninstalled");
		expect(result.output).toContain(`Removed: ${trumboSkillDir}`);
		expect(existsSync(trumboSkillDir)).toBe(false);
	});

	it("uninstalls official marketplace plugins by marketplace slug", async () => {
		const installPath = join(
			home,
			".trumbo",
			"plugins",
			"_installed",
			"official",
			"goal-123456789abc",
		);
		const entryPath = join(installPath, "package", "index.ts");
		await mkdir(join(installPath, "package"), { recursive: true });
		await writeFile(
			join(installPath, "package.json"),
			JSON.stringify({ name: "goal" }, null, 2),
			"utf8",
		);
		await writeFile(
			entryPath,
			"export default { name: 'goal', manifest: { capabilities: ['tools'] } };",
			"utf8",
		);

		const result = await uninstallMarketplaceEntry({
			id: "goal",
			type: "plugin",
			name: "Goal",
			install: { args: ["goal"] },
		});

		expect(result).toMatchObject({
			id: "goal",
			type: "plugin",
			status: "uninstalled",
			message: "Uninstalled Goal.",
		});
		expect(existsSync(installPath)).toBe(false);
	});
});
