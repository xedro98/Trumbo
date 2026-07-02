// ---------------------------------------------------------------------------
// trembo config - CLI tests
//
// Covers:
//   - `trembo config --config <dir>` - shows config for specific directory
//   - `trembo config --help`         - help page
// ---------------------------------------------------------------------------

import { test } from "@microsoft/tui-test";
import { TREMBO_BIN, TERMINAL_WIDE } from "../helpers/constants.js";
import { tremboEnv } from "../helpers/env.js";
import { expectVisible } from "../helpers/terminal.js";

test.describe("trembo config --help", () => {
	test.use({
		program: { file: TREMBO_BIN, args: ["config", "--help"] },
		...TERMINAL_WIDE,
		env: tremboEnv("default"),
	});

	test("shows config help page", async ({ terminal }) => {
		await expectVisible(terminal, ["Usage:", "--config"]);
	});
});
