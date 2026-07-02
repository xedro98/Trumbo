import { test } from "@microsoft/tui-test";
import { TREMBO_BIN } from "./helpers/constants.js";
import { tremboEnv } from "./helpers/env.js";
import { expectVisible } from "./helpers/terminal.js";

// ---------------------------------------------------------------------------
// trembo --version  (root flag)
// ---------------------------------------------------------------------------
test.describe("trembo --version", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["--version"] },
		env: tremboEnv("claude-sonnet-4.6"),
	});

	test("prints the version string", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});

// ---------------------------------------------------------------------------
// trembo -V  (short flag)
// ---------------------------------------------------------------------------
test.describe("trembo -V", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["-V"] },
		env: tremboEnv("claude-sonnet-4.6"),
	});

	test("prints the version string with short flag", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});

// ---------------------------------------------------------------------------
// trembo version  (subcommand)
// ---------------------------------------------------------------------------
test.describe("trembo version subcommand", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["version"] },
		env: tremboEnv("claude-sonnet-4.6"),
	});

	test("prints 'Trembo CLI version:' message", async ({ terminal }) => {
		await expectVisible(terminal, /\d+\.\d+\.\d+/g);
	});
});
