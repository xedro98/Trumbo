#!/usr/bin/env bun

/**
 * Prepare a CLI release: bump version, update CHANGELOG, commit, tag, and push.
 * Pushing the cli-v* tag automatically triggers `.github/workflows/cli-publish.yml`.
 *
 * Usage:
 *   bun engine/scripts/prepare-cli-release.ts              # patch bump, interactive
 *   bun engine/scripts/prepare-cli-release.ts 3.0.41         # explicit version
 *   bun engine/scripts/prepare-cli-release.ts --push         # patch bump + push commit/tag
 *   bun engine/scripts/prepare-cli-release.ts 3.0.41 --push --yes
 *   bun engine/scripts/prepare-cli-release.ts --notes "Fix foo"
 */

import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";

const { values, positionals } = parseArgs({
	args: Bun.argv.slice(2),
	options: {
		push: { type: "boolean", default: false },
		yes: { type: "boolean", default: false },
		notes: { type: "string" },
		"dry-run": { type: "boolean", default: false },
	},
	allowPositionals: true,
	strict: true,
});

const dryRun = values["dry-run"] ?? false;
const shouldPush = values.push ?? false;
const autoYes = values.yes ?? false;
const explicitNotes = values.notes?.trim();
const explicitVersion = positionals[0];

const root = join(import.meta.dir, "..", "..");
const cliDir = join(root, "projects", "console");
const packageJsonPath = join(cliDir, "package.json");
const changelogPath = join(cliDir, "CHANGELOG.md");
const MAIN_BRANCH = "main";

function header(msg: string): void {
	console.log(`\n${"─".repeat(60)}`);
	console.log(`  ${msg}`);
	console.log(`${"─".repeat(60)}\n`);
}

async function run(
	cmd: string[],
	options: { cwd?: string; stdout?: "inherit" | "pipe" } = {},
): Promise<string> {
	const cwd = options.cwd ?? root;
	const label = cmd.join(" ");

	if (dryRun) {
		console.log(`  [dry-run] ${label}`);
		return "";
	}

	console.log(`  $ ${label}`);

	const proc = Bun.spawn(cmd, {
		cwd,
		stdin: "inherit",
		stdout: options.stdout ?? "inherit",
		stderr: "inherit",
	});

	const exitCode = await proc.exited;
	const stdout =
		options.stdout === "pipe" && proc.stdout
			? await new Response(proc.stdout).text()
			: "";

	if (exitCode !== 0) {
		throw new Error(`Command failed (exit ${exitCode}): ${label}`);
	}
	return stdout;
}

async function confirm(prompt: string): Promise<boolean> {
	if (autoYes) return true;
	process.stdout.write(`${prompt} [y/N] `);
	for await (const line of console) {
		const answer = line.trim().toLowerCase();
		return answer === "y" || answer === "yes";
	}
	return false;
}

function incrementPatchVersion(input: string): string {
	const match = input.match(/^(\d+)\.(\d+)\.(\d+)(-[\w.]+)?$/);
	if (!match) {
		throw new Error(`Invalid semver version: ${input}`);
	}
	const [, major, minor, patch] = match;
	return `${major}.${minor}.${Number(patch) + 1}`;
}

async function readCurrentVersion(): Promise<string> {
	const raw = await readFile(packageJsonPath, "utf8");
	const pkg = JSON.parse(raw) as { version?: string };
	if (!pkg.version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(pkg.version)) {
		throw new Error(
			`Invalid version in projects/console/package.json: ${pkg.version ?? "(missing)"}`,
		);
	}
	return pkg.version;
}

async function latestCliTag(): Promise<string | undefined> {
	const tags = (
		await run(["git", "tag", "--list", "cli-v*", "--sort=-v:refname"], {
			stdout: "pipe",
		})
	)
		.split(/\r?\n/)
		.map((tag) => tag.trim())
		.filter(Boolean);
	return tags[0];
}

async function draftNotesFromGit(
	version: string,
	sinceTag?: string,
): Promise<string> {
	const range = sinceTag ? `${sinceTag}..HEAD` : "HEAD";
	const commits = (
		await run(
			[
				"git",
				"log",
				range,
				"--oneline",
				"--no-merges",
				"--",
				"projects/console",
				"engine/packages",
				".github/workflows/cli-publish.yml",
			],
			{ stdout: "pipe" },
		)
	)
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean);

	if (commits.length === 0) {
		return `- CLI release ${version}.`;
	}

	return commits
		.slice(0, 12)
		.map((line) => {
			const subject = line.replace(/^[0-9a-f]+\s+/, "");
			return `- ${subject}`;
		})
		.join("\n");
}

function prependChangelogSection(
	content: string,
	version: string,
	notes: string,
): string {
	const section = `## ${version}\n\n${notes.trim()}\n\n`;
	const anchor = "\n## ";
	const idx = content.indexOf(anchor);
	if (idx === -1) {
		return `${content.trimEnd()}\n\n${section}`;
	}
	return `${content.slice(0, idx)}\n\n${section}${content.slice(idx + 1)}`;
}

async function ensureCleanWorkingTree(): Promise<void> {
	const status = (
		await run(["git", "status", "--porcelain"], { stdout: "pipe" })
	).trim();
	if (status) {
		throw new Error(
			`Working tree is dirty. Commit or stash changes before releasing.\n${status}`,
		);
	}
}

async function ensureOnMain(): Promise<void> {
	const branch = (
		await run(["git", "rev-parse", "--abbrev-ref", "HEAD"], { stdout: "pipe" })
	).trim();
	if (branch !== MAIN_BRANCH) {
		throw new Error(
			`Expected to be on ${MAIN_BRANCH}, currently on ${branch || "(detached)"}.`,
		);
	}
}

async function main(): Promise<number> {
	header("Prepare CLI release");

	await ensureOnMain();
	await ensureCleanWorkingTree();

	const currentVersion = await readCurrentVersion();
	const version = explicitVersion ?? incrementPatchVersion(currentVersion);
	if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
		throw new Error(`Invalid release version: ${version}`);
	}

	const tag = `cli-v${version}`;
	const sinceTag = await latestCliTag();
	const notes = explicitNotes ?? (await draftNotesFromGit(version, sinceTag));

	console.log(`  Current version: ${currentVersion}`);
	console.log(`  Release version: ${version}`);
	console.log(`  Git tag:         ${tag}`);
	console.log(`  Since tag:       ${sinceTag ?? "(none)"}`);
	console.log(`  Push when done:  ${shouldPush ? "yes" : "no"}`);
	console.log(`  Dry run:         ${dryRun}`);
	console.log("");
	console.log("  Changelog notes:");
	console.log(
		notes
			.split("\n")
			.map((line) => `    ${line}`)
			.join("\n"),
	);

	if (!(await confirm("\nApply release prep?"))) {
		console.log("Aborted.");
		return 1;
	}

	if (!dryRun) {
		const raw = await readFile(packageJsonPath, "utf8");
		const pkg = JSON.parse(raw) as Record<string, unknown>;
		pkg.version = version;
		await writeFile(
			packageJsonPath,
			`${JSON.stringify(pkg, null, "\t")}\n`,
			"utf8",
		);

		const changelog = await readFile(changelogPath, "utf8");
		await writeFile(
			changelogPath,
			prependChangelogSection(changelog, version, notes),
			"utf8",
		);

		await run([
			"git",
			"add",
			"projects/console/package.json",
			"projects/console/CHANGELOG.md",
		]);
		await run(["git", "commit", "-m", `chore(cli): release v${version}`]);
		await run(["git", "tag", "-a", tag, "-m", `CLI v${version}`]);
	}

	if (shouldPush) {
		if (!(await confirm("\nPush commit and tag to origin?"))) {
			console.log("Skipped push. Publish manually with:");
			console.log(`  git push origin ${MAIN_BRANCH}`);
			console.log(`  git push origin refs/tags/${tag}`);
			return 0;
		}
		await run(["git", "push", "origin", MAIN_BRANCH]);
		await run(["git", "push", "origin", `refs/tags/${tag}`]);
		console.log("");
		console.log("  Tag pushed. CI publish should start automatically.");
		console.log(
			`  Watch: gh run list --workflow=cli-publish.yml --limit=1 --json url,status,conclusion --jq '.[0]'`,
		);
	} else {
		console.log("");
		console.log("  Release prepared locally. Next steps:");
		console.log(`    git push origin ${MAIN_BRANCH}`);
		console.log(`    git push origin refs/tags/${tag}`);
		console.log("  Pushing the tag triggers cli-publish automatically.");
	}

	return 0;
}

try {
	process.exit(await main());
} catch (error) {
	console.error(
		`\nError: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exit(1);
}
