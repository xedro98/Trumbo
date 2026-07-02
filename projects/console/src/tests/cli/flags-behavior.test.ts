// ---------------------------------------------------------------------------
// CLI flag behavioral tests
//
// These tests verify the runtime behavior of each CLI flag, not just that
// the flag appears in --help output (that's covered in tests/flags.test.ts),
// but that the flag actually changes what trumbo does.
//
// Tests marked in the spec reflect known gaps where the flag is accepted
// but currently has no observable effect. They are still written so the
// behavior can be asserted once the implementation catches up.
// ---------------------------------------------------------------------------

import { test } from "@microsoft/tui-test";
import { TERMINAL_WIDE, TRUMBO_BIN } from "../helpers/constants.js";
import { trumboEnv } from "../helpers/env.js";
import { waitForChatReady } from "../helpers/page-objects/chat.js";
import { expectVisible } from "../helpers/terminal.js";

test.describe("trumbo --model (interactive mode, flag ignored)", () => {
	test.use({
		program: {
			file: TRUMBO_BIN,
			args: ["--model", "openai/gpt-5.3-codex"],
		},
		...TERMINAL_WIDE,
		env: trumboEnv("default"),
	});

	test("starts interactive mode", async ({ terminal }) => {
		await waitForChatReady(terminal);
		await expectVisible(terminal, "GPT-5.3 Codex");
	});
});

test.describe("trumbo --cwd <dir>", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["--cwd", "/tmp"] },
		...TERMINAL_WIDE,
		env: trumboEnv("default"),
	});

	test("starts interactive mode with --cwd flag", async ({ terminal }) => {
		await waitForChatReady(terminal);
		await expectVisible(terminal, "tmp");
	});
});

test.describe("trumbo -c <dir> (short alias)", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["-c", "/tmp"] },
		...TERMINAL_WIDE,
		env: trumboEnv("default"),
	});

	test("starts interactive mode with -c flag", async ({ terminal }) => {
		await waitForChatReady(terminal);
		await expectVisible(terminal, "tmp");
	});
});

test.describe("trumbo --config (claude-sonnet-4.6)", () => {
	test.use({
		program: {
			file: TRUMBO_BIN,
			args: ["--config", "configs/claude-sonnet-4.6"],
		},
		...TERMINAL_WIDE,
		env: trumboEnv("claude-sonnet-4.6"),
	});

	test("starts interactive mode with custom config directory", async ({
		terminal,
	}) => {
		await expectVisible(terminal, "Claude Sonnet 4.6");
	});
});

// ---------------------------------------------------------------------------
// trumbo --json --yolo "prompt"
// Starts trumbo in headless yolo mode with all output conforming to JSON
// ---------------------------------------------------------------------------
test.describe("trumbo --json (headless yolo mode)", () => {
	test.use({
		program: { file: TRUMBO_BIN, args: ["--json", "--yolo", "tell me a joke"] },
		...TERMINAL_WIDE,
		env: trumboEnv("unauthenticated"),
	});

	test("starts in headless yolo mode with JSON output", async ({
		terminal,
	}) => {
		// Explicit yolo with --json should produce a JSON error line.
		await expectVisible(terminal, /Unauthorized|Missing API key/i);
	});
});
