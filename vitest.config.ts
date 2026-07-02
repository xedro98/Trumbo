import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		projects: [
			"engine/packages/agents/vitest.config.ts",
			"engine/packages/core/vitest.config.ts",
			"engine/packages/llms/vitest.config.ts",
			"engine/packages/shared/vitest.config.ts",
			"projects/console/vitest.config.ts",
		],
	},
});
