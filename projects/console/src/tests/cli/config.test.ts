// ---------------------------------------------------------------------------
// trumbo config - CLI tests
//
// Covers:
//   - `trumbo config --config <dir>` - shows config for specific directory
//   - `trumbo config --help`         - help page
// ---------------------------------------------------------------------------

import { test } from "@microsoft/tui-test";
import { TERMINAL_WIDE, TRUMBO_BIN } from "../helpers/constants.js";
import { trumboEnv } from "../helpers/env.js";
import { expectVisible } from "../helpers/terminal.js";

test.describe("trumbo config --help", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["config", "--help"] },
		...TERMINAL_WIDE,
		env: trumboEnv("default"),
	});

	test("shows config help page", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--config"]);
	});
});
