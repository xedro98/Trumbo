// One-time bootstrap to enable npm Trusted Publishing.
//
// npm does NOT allow configuring a trusted publisher for a package that does
// not yet exist on the registry (npm/cli#8544). These 7 packages are new, so
// we must publish a minimal placeholder (0.0.0) for each name first. After the
// names exist, configure a trusted publisher for each on npmjs.com, then the
// real version is published from CI via OIDC (no token).
//
// Prereqs:
//   1. `npm login` as trumbodev (interactive 2FA), OR set a short-lived
//      Classic Automation token in a LOCAL .npmrc (do NOT put it in CI):
//        //registry.npmjs.org/:_authToken=<automation-token>
//   2. Run:  bun script/bootstrap-trusted-publishing.ts
//
// This publishes version 0.0.0 only. The real packages come from CI.
// After the real 3.0.37 is published you can `npm deprecate <name>@0.0.0`.

import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { $ } from "bun";

const PACKAGES = [
	"@trumbodev/cli-darwin-arm64",
	"@trumbodev/cli-darwin-x64",
	"@trumbodev/cli-linux-arm64",
	"@trumbodev/cli-linux-x64",
	"@trumbodev/cli-windows-arm64",
	"@trumbodev/cli-windows-x64",
	"@trumbodev/cli",
];

const REPO = "https://github.com/xedro98/Trumbo";
const root = join(tmpdir(), "trumbo-trusted-publishing-bootstrap");

rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });

let ok = 0;
let skipped = 0;
const failed: string[] = [];

console.log("Preflight: npm whoami");
try {
	const who = await $`npm whoami`.quiet();
	console.log(`  logged in as: ${who.stdout.toString().trim() || "(empty)"}`);
} catch (e) {
	const err = e as { stderr?: Buffer; stdout?: Buffer };
	const detail =
		err.stderr?.toString().trim() ||
		err.stdout?.toString().trim() ||
		"(no output)";
	console.error(
		`  NOT authenticated:\n${detail
			.split("\n")
			.map((l) => `    ${l}`)
			.join("\n")}`,
	);
	console.error(
		"  Run `npm login` first, OR put a Classic Automation token in ~/.npmrc:",
	);
	console.error("    //registry.npmjs.org/:_authToken=<automation-token>");
	process.exit(1);
}
console.log("");

for (const name of PACKAGES) {
	const slug = name.replace(/^@/, "").replace(/\//g, "-");
	const dir = join(root, slug);
	mkdirSync(dir, { recursive: true });
	writeFileSync(
		join(dir, "package.json"),
		`${JSON.stringify(
			{
				name,
				version: "0.0.0",
				description:
					"Placeholder published only to bootstrap npm Trusted Publishing (OIDC). The real package is published from CI. Do not depend on this version.",
				repository: { type: "git", url: REPO },
			},
			null,
			2,
		)}\n`,
	);
	console.log(`\n→ ${name}@0.0.0`);
	try {
		await $`npm publish --access public`.cwd(dir).quiet();
		console.log("  published");
		ok++;
	} catch (e) {
		const err = e as { stderr?: Buffer; stdout?: Buffer; message?: string };
		const stderr = err.stderr?.toString().trim() ?? "";
		const stdout = err.stdout?.toString().trim() ?? "";
		const detail = stderr || stdout || err.message || String(e);
		if (
			/publish over the previously published|EPUBLISHCONFLICT|E409/i.test(
				detail,
			)
		) {
			console.log(`  already exists (0.0.0 present) — skipped`);
			skipped++;
		} else {
			console.error(
				`  FAILED:\n${detail
					.split("\n")
					.map((l) => `    ${l}`)
					.join("\n")}`,
			);
			failed.push(
				`${name}: ${
					detail
						.split("\n")
						.find((l) =>
							/error|E[A-Z0-9]+|two-factor|one-time|forbidden|required/i.test(
								l,
							),
						) ?? detail.split("\n")[0]
				}`,
			);
		}
	}
}

console.log(
	`\nDone. published=${ok} skipped=${skipped} failed=${failed.length}`,
);
if (failed.length > 0) {
	console.error("\nFailures:");
	for (const f of failed) console.error(`  - ${f}`);
	process.exit(1);
}
console.log(
	"\nNext: configure a trusted publisher for EACH package on npmjs.com:",
);
console.log(
	"  Packages → <name> → Settings → Trusted publishing → GitHub Actions",
);
console.log(
	"  Organization or user = xedro98 | Repository = Trumbo | Workflow filename = cli-publish.yml | Environment = (blank)",
);
console.log(
	"Then re-trigger the cli-publish workflow with git_tag=cli-v3.0.37.",
);
