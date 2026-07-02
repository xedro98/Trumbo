import { test } from "@microsoft/tui-test";
import { TRUMBO_BIN } from "./helpers/constants.js";
import { trumboEnv } from "./helpers/env.js";
import { expectVisible } from "./helpers/terminal.js";

// ---------------------------------------------------------------------------
// trumbo --version  (root flag)
// ---------------------------------------------------------------------------
test.describe("trumbo --version", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["--version"] },
		env: trumboEnv("claude-sonnet-4.6"),
	});

	test("prints the version string", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});

// ---------------------------------------------------------------------------
// trumbo -V  (short flag)
// ---------------------------------------------------------------------------
test.describe("trumbo -V", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["-V"] },
		env: trumboEnv("claude-sonnet-4.6"),
	});

	test("prints the version string with short flag", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});

// ---------------------------------------------------------------------------
// trumbo version  (subcommand)
// ---------------------------------------------------------------------------
test.describe("trumbo version subcommand", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["version"] },
		env: trumboEnv("claude-sonnet-4.6"),
	});

	test("prints 'Trumbo CLI version:' message", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});
