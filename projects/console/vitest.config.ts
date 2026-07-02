import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	resolve: {
		alias: [
			{
				find: /^@trumbo\/core\/telemetry$/,
				replacement: resolve(
					rootDir,
					"../../engine/packages/core/src/services/telemetry/index.ts",
				),
			},
			{
				find: /^@trumbo\/core$/,
				replacement: resolve(
					rootDir,
					"../../engine/packages/core/src/index.ts",
				),
			},
			{
				find: /^@trumbo\/core\/(.+)$/,
				replacement: resolve(rootDir, "../../engine/packages/core/src/$1"),
			},
			{
				find: /^@trumbo\/llms$/,
				replacement: resolve(
					rootDir,
					"../../engine/packages/llms/src/index.ts",
				),
			},
			{
				find: /^@trumbo\/llms\/(.+)$/,
				replacement: resolve(rootDir, "../../engine/packages/llms/src/$1"),
			},
			{
				find: /^@trumbo\/shared\/(.+)$/,
				replacement: resolve(rootDir, "../../engine/packages/shared/src/$1"),
			},
			{
				find: /^@trumbo\/agents$/,
				replacement: resolve(
					rootDir,
					"../../engine/packages/agents/src/index.ts",
				),
			},
			{
				find: /^@trumbo\/core$/,
				replacement: resolve(
					rootDir,
					"../../engine/packages/core/src/index.ts",
				),
			},
			{
				find: /^@trumbo\/shared$/,
				replacement: resolve(
					rootDir,
					"../../engine/packages/shared/src/index.ts",
				),
			},
		],
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
		exclude: ["src/**/*.e2e.test.ts", "src/tests/**"],
		// Default 5s is tight on CI: each test uses `resetModules()` + dynamic `import("./main")`
		// (large graph). Cold transforms occasionally exceed 5s on shared runners.
		testTimeout: 15_000,
		pool: "forks",
		maxWorkers: 1,
		fileParallelism: false,
	},
});
