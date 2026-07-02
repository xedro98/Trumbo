import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	root: rootDir,
	resolve: {
		alias: [
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
				find: /^@trumbo\/shared$/,
				replacement: resolve(
					rootDir,
					"../../engine/packages/shared/src/index.ts",
				),
			},
			{
				find: /^@trumbo\/shared\/(.+)$/,
				replacement: resolve(rootDir, "../../engine/packages/shared/src/$1"),
			},
		],
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
