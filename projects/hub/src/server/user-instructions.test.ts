import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { listUserInstructionConfigs } from "./user-instructions";

describe("listUserInstructionConfigs", () => {
	const tempRoots: string[] = [];
	const envSnapshot = {
		TRUMBO_GLOBAL_SETTINGS_PATH: process.env.TRUMBO_GLOBAL_SETTINGS_PATH,
		TRUMBO_MCP_SETTINGS_PATH: process.env.TRUMBO_MCP_SETTINGS_PATH,
	};

	afterEach(async () => {
		if (envSnapshot.TRUMBO_GLOBAL_SETTINGS_PATH === undefined) {
			delete process.env.TRUMBO_GLOBAL_SETTINGS_PATH;
		} else {
			process.env.TRUMBO_GLOBAL_SETTINGS_PATH =
				envSnapshot.TRUMBO_GLOBAL_SETTINGS_PATH;
		}
		if (envSnapshot.TRUMBO_MCP_SETTINGS_PATH === undefined) {
			delete process.env.TRUMBO_MCP_SETTINGS_PATH;
		} else {
			process.env.TRUMBO_MCP_SETTINGS_PATH =
				envSnapshot.TRUMBO_MCP_SETTINGS_PATH;
		}
		await Promise.all(
			tempRoots.map((dir) => rm(dir, { recursive: true, force: true })),
		);
		tempRoots.length = 0;
	});

	it("uses the package name for package-backed plugin entries", async () => {
		const tempRoot = await mkdtemp(join(tmpdir(), "hub-config-"));
		tempRoots.push(tempRoot);
		process.env.TRUMBO_GLOBAL_SETTINGS_PATH = join(tempRoot, "settings.json");
		process.env.TRUMBO_MCP_SETTINGS_PATH = join(tempRoot, "mcp.json");
		const packageDir = join(
			tempRoot,
			".trumbo",
			"plugins",
			"_installed",
			"git",
			"github.com",
			"demo",
			"package",
		);
		await mkdir(packageDir, { recursive: true });
		const pluginPath = join(packageDir, "index.ts");
		await writeFile(
			join(packageDir, "package.json"),
			JSON.stringify(
				{
					name: "trumbo-sdk-portable-agents",
					trumbo: {
						plugins: [{ paths: ["./index.ts"] }],
					},
				},
				null,
				2,
			),
		);
		await writeFile(pluginPath, "export default {};\n");

		const data = await listUserInstructionConfigs(tempRoot);
		const plugins = data.plugins as Array<{ name: string; path: string }>;
		const plugin = plugins.find((item) => item.path === pluginPath);

		expect(plugin?.name).toBe("trumbo-sdk-portable-agents");
	});
});
