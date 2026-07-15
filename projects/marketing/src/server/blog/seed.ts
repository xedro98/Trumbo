import type { D1Database } from "@cloudflare/workers-types";
import { ensureAdminUser } from "./users";

const SEED_CATEGORIES = [
	{ slug: "engineering", name: "Engineering" },
	{ slug: "cli", name: "CLI" },
	{ slug: "platform", name: "Platform" },
	{ slug: "design", name: "Design" },
] as const;

const SEED_POSTS = [
	{
		slug: "building-the-trumbo-platform",
		title: "Building the Trumbo platform",
		excerpt:
			"How we run the platform on Trumbo edge infrastructure, managed SQL, and static assets, and why we split marketing from the authenticated app.",
		body: "<p>Trumbo's platform runs on Trumbo edge infrastructure with managed SQL for application state and static assets for the marketing site.</p><p>Splitting marketing from the authenticated app keeps trumbo.dev fast and public while platform.trumbo.dev handles auth, billing, and team workflows.</p>",
		categorySlug: "engineering",
		publishedAt: "2026-06-01T00:00:00.000Z",
	},
	{
		slug: "publishing-trumbodev-cli-to-npm",
		title: "Publishing @trumbodev/cli to npm",
		excerpt:
			"GitHub Actions, semver, and keeping the OpenTUI terminal UI stable across Windows, macOS, and Linux.",
		body: "<p>We ship the Trumbo CLI as @trumbodev/cli on npm with semver releases driven by GitHub Actions.</p><p>Cross-platform TUI stability means testing OpenTUI on Windows, macOS, and Linux before every release.</p>",
		categorySlug: "cli",
		publishedAt: "2026-05-01T00:00:00.000Z",
	},
	{
		slug: "org-scoped-billing-and-subscription-fixes",
		title: "Org-scoped billing and subscription fixes",
		excerpt:
			"Personal orgs, legacy scope fallbacks, and checkout polling: lessons from shipping Stripe on the Trumbo platform.",
		body: "<p>Org-scoped billing required careful handling of personal workspaces, legacy subscription scopes, and Stripe checkout polling on the Trumbo platform.</p><p>The result is checkout that resolves reliably even when webhooks arrive late.</p>",
		categorySlug: "platform",
		publishedAt: "2026-04-01T00:00:00.000Z",
	},
	{
		slug: "trumbo-admin-ui-adoption",
		title: "Trumbo admin UI adoption",
		excerpt:
			"Migrating buttons, charts, and tabs to our admin component library while keeping Trumbo green as the brand anchor.",
		body: "<p>We adopted a shared admin component library for buttons, charts, and tabs across the platform and marketing site.</p><p>Trumbo green stays the brand anchor while the library handles accessibility and component consistency.</p>",
		categorySlug: "design",
		publishedAt: "2026-03-01T00:00:00.000Z",
	},
	{
		slug: "why-context-beats-benchmarks",
		title: "Why context beats benchmarks",
		excerpt:
			"The best model on a leaderboard is rarely the best model for your repo. We stopped chasing scores and started measuring what actually ships.",
		body: "<p>Every few weeks a new model tops a public benchmark. Teams rush to update defaults, rewrite prompts, and re-run internal evals. We did this too — until we noticed something awkward: the model that scored highest almost never produced the best diffs in real repositories.</p><h2>Benchmarks measure tasks, not workflows</h2><p>Leaderboards reward isolated completions: fix this function, answer this trivia question, pass this unit test in a sandbox. Production work is messier. The agent needs your <code>AGENTS.md</code>, the failing CI log, the file three directories away that exports the type everyone imports wrong, and the permission rule that says never touch <code>.env</code>.</p><p>A model that nails HumanEval but hallucinates your package boundaries is not an upgrade. It is a distraction.</p><h2>What we measure instead</h2><p>We now judge models on workflow outcomes: fewer round trips to green CI, less time re-explaining repo conventions, fewer rejected tool calls, and whether a session survives a provider switch without losing thread.</p><blockquote><p>Context is the product. The model is the engine.</p></blockquote><p>That shift changed how Trumbo routes requests. Fast models handle narrow edits; reasoning models get pulled in when the diff touches architecture; org policy can pin a compliant provider without forking the CLI experience.</p><h2>Try this on your team</h2><p>Pick one real task you shipped last week — a bugfix, migration, or refactor. Replay it with two models and score only what mattered: correctness, diff size, and how many times you had to re-paste context. The winner is your default until the next real task proves otherwise.</p><p>Benchmarks are useful for spotting capability jumps. They are terrible for picking a daily driver. Your repository already contains the eval set that matters.</p>",
		categorySlug: "engineering",
		publishedAt: "2026-07-02T00:00:00.000Z",
	},
	{
		slug: "permissions-as-product-design",
		title: "Permissions are product design",
		excerpt:
			"Autonomous agents are impressive in demos and terrifying in production. Explicit approval is not friction — it is how you earn trust at the terminal.",
		body: "<p>There is a version of AI tooling that feels magical for the first ten minutes: the agent reads files, runs commands, edits code, and deploys — all without asking. Then you notice the test file it deleted, the dependency it added, or the shell command that touched production credentials.</p><p>We built Trumbo assuming the second story is the one that sticks.</p><h2>Approval is not a speed bump</h2><p>Every destructive or irreversible action should be legible before it runs: which file, which command, which network call. Developers should be able to glance at a prompt and know exactly what will change. That is not slowing the agent down; it is making the agent legible.</p><p>We treat permissions like Git hooks, not like nag dialogs. Rules live in version control (<code>.trembo/permissions.json</code>), matchers follow tool names developers already understand, and always-allow learning is opt-in per pattern — not a blanket “trust me forever.”</p><h2>What good feels like</h2><ul><li>Read and search operations flow without interruption.</li><li>Edits outside the working tree pause for confirmation.</li><li>Shell commands show the full string, not a summarized intent.</li><li>Rejecting a tool call does not corrupt the session or lose prior context.</li></ul><p>The goal is not zero prompts. The goal is zero surprises.</p><h2>Design for the eight-hour session</h2><p>Demos optimize for the wow moment. Products optimize for the engineer who leaves the tool open all day. Predictability compounds: once you trust that nothing happens in the dark, you delegate more — not less.</p><p>Autonomy is a spectrum. Trumbo defaults toward the side of the spectrum where you stay in control, because the terminal is already a place where one wrong command has real consequences. Permissions are not a missing feature on the road to full autonomy. They are how you get there without breaking production.</p>",
		categorySlug: "platform",
		publishedAt: "2026-06-15T00:00:00.000Z",
	},
] as const;

export async function ensureBlogSeed(
	db: D1Database,
	options?: { adminEmail?: string; adminPassword?: string },
): Promise<void> {
	await ensureAdminUser(db, options?.adminEmail, options?.adminPassword);

	const postCount = await db
		.prepare("SELECT COUNT(*) AS count FROM blog_posts")
		.first<{ count: number }>();
	if ((postCount?.count ?? 0) > 0) {
		return;
	}

	// Categories remain after posts are deleted; don't re-seed demo content.
	const categoryCount = await db
		.prepare("SELECT COUNT(*) AS count FROM blog_categories")
		.first<{ count: number }>();
	if ((categoryCount?.count ?? 0) > 0) {
		return;
	}

	for (const category of SEED_CATEGORIES) {
		await db
			.prepare("INSERT OR IGNORE INTO blog_categories (slug, name) VALUES (?, ?)")
			.bind(category.slug, category.name)
			.run();
	}

	for (const post of SEED_POSTS) {
		const category = await db
			.prepare("SELECT id FROM blog_categories WHERE slug = ?")
			.bind(post.categorySlug)
			.first<{ id: number }>();

		await db
			.prepare(
				`INSERT INTO blog_posts (slug, title, excerpt, body, category_id, published, published_at)
				 VALUES (?, ?, ?, ?, ?, 1, ?)`,
			)
			.bind(
				post.slug,
				post.title,
				post.excerpt,
				post.body,
				category?.id ?? null,
				post.publishedAt,
			)
			.run();
	}
}
