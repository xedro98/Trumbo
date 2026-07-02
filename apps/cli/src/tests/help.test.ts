import { test } from "@microsoft/tui-test";
import { TREMBO_BIN } from "./helpers/constants.js";
import { tremboEnv } from "./helpers/env.js";
import { expectVisible } from "./helpers/terminal.js";

const HELP_TERMINAL = { columns: 120, rows: 50 };

// ===========================================================================
// trembo --help  (root help)
// ===========================================================================
test.describe("trembo --help", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["--help"] },
		env: tremboEnv("claude-sonnet-4.6"),
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
// trembo -h  (short help flag)
// ===========================================================================
test.describe("trembo -h", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["-h"] },
		env: tremboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows Usage line with short flag", async ({ terminal }) => {
		await expectVisible(terminal, "Usage:");
	});
});

// ===========================================================================
// trembo history --help
// ===========================================================================
test.describe("trembo history --help", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["history", "--help"] },
		env: tremboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows history usage and all flags", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit", "--page", "--config"]);
	});
});

// ===========================================================================
// trembo h --help  (history alias)
// ===========================================================================
test.describe("trembo h --help (history alias)", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["h", "--help"] },
		env: tremboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows history usage and flags via alias", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--limit"]);
	});
});

// ===========================================================================
// trembo config --help
// ===========================================================================
test.describe("trembo config --help", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["config", "--help"] },
		env: tremboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows config usage and --config flag", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--config"]);
	});
});

// ===========================================================================
// trembo auth --help
// ===========================================================================
test.describe("trembo auth --help", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["auth", "--help"] },
		env: tremboEnv("claude-sonnet-4.6"),
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
// trembo version --help
// ===========================================================================
test.describe("trembo version --help", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["version", "--help"] },
		env: tremboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows version command usage", async ({ terminal }) => {
		await expectVisible(terminal, "Usage:");
	});
});

// ===========================================================================
// trembo update --help
// ===========================================================================
test.describe("trembo update --help", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["update", "--help"] },
		env: tremboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows update usage and --verbose flag", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--verbose"]);
	});
});

// ===========================================================================
// trembo doctor --help
// ===========================================================================
test.describe("trembo doctor --help", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["doctor", "--help"] },
		env: tremboEnv("claude-sonnet-4.6"),
		...HELP_TERMINAL,
	});

	test("shows doctor usage and lists fix and log subcommands", async ({
		terminal,
	}) => {
		await expectVisible(terminal, ["Usage:", "fix", "log"]);
	});
});
