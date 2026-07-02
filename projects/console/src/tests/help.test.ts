import { test } from "@microsoft/tui-test";
import { TRUMBO_BIN } from "./helpers/constants.js";
import { trumboEnv } from "./helpers/env.js";
import { expectVisible } from "./helpers/terminal.js";

const HELP_TERMINAL = { columns: 120, rows: 50 };

// ===========================================================================
// trumbo --help  (root help)
// ===========================================================================
test.describe("trumbo --help", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["--help"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows Usage line and lists all subcommands", async ({ terminal }) => {
		await expectVisible(terminal, [
			"Usage:",
			"history|h",
			"auth [options]",
			"version",
			"update [options]",
			"hub ",
		]);
	});

	test("shows all root-level option flags", async ({ terminal }) => {
		await expectVisible(terminal, [
			"--plan",
			"--timeout",
			"--model",
			"--verbose",
			"--cwd",
			"--config",
			"--thinking",
			"--retries",
			"--json",
			"--acp",
			"--update",
		]);
	});
});

// ===========================================================================
// trumbo -h  (short help flag)
// ===========================================================================
test.describe("trumbo -h", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["-h"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows Usage line with short flag", async ({ terminal }) => {
		await expectVisible(terminal, "Usage:");
	});
});

// ===========================================================================
// trumbo history --help
// ===========================================================================
test.describe("trumbo history --help", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["history", "--help"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows history usage and all flags", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit", "--page", "--config"]);
	});
});

// ===========================================================================
// trumbo h --help  (history alias)
// ===========================================================================
test.describe("trumbo h --help (history alias)", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["h", "--help"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows history usage and flags via alias", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit"]);
	});
});

// ===========================================================================
// trumbo config --help
// ===========================================================================
test.describe("trumbo config --help", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["config", "--help"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows config usage and --config flag", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--config"]);
	});
});

// ===========================================================================
// trumbo auth --help
// ===========================================================================
test.describe("trumbo auth --help", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["auth", "--help"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows auth usage and all flags", async ({ terminal }) => {
		await expectVisible(terminal, [
			"Usage:",
			"--provider",
			"--apikey",
			"--modelid",
			"--baseurl",
			"--config",
		]);
	});
});

// ===========================================================================
// trumbo version --help
// ===========================================================================
test.describe("trumbo version --help", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["version", "--help"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows version command usage", async ({ terminal }) => {
		await expectVisible(terminal, "Usage:");
	});
});

// ===========================================================================
// trumbo update --help
// ===========================================================================
test.describe("trumbo update --help", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["update", "--help"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows update usage and --verbose flag", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--verbose"]);
	});
});

// ===========================================================================
// trumbo doctor --help
// ===========================================================================
test.describe("trumbo doctor --help", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["doctor", "--help"] },
		env: trumboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows doctor usage and lists fix and log subcommands", async ({
		terminal,
	}) => {
		await expectVisible(terminal, ["Usage:", "fix", "log"]);
	});
});
