#!/usr/bin/env node
/**
 * Converts the Mintlify-style MDX docs in /book to VitePress Markdown files
 * in /projects/docs. Run once (or after editing book/ content):
 *
 *   node scripts/convert-docs.mjs
 *
 * Also generates .vitepress/sidebar.json from book/docs.json navigation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS_ROOT = path.resolve(__dirname, "..");
const BOOK_DIR = path.resolve(DOCS_ROOT, "..", "..", "book");
const OUT_DIR = DOCS_ROOT;
const SIDEBAR_OUT = path.join(OUT_DIR, ".vitepress", "sidebar.json");

// --- frontmatter ---
function parseFrontmatter(raw) {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!match) return { meta: {}, body: raw.trim() };
	const meta = {};
	for (const line of match[1].split("\n")) {
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		let value = line.slice(idx + 1).trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
			value = value.slice(1, -1);
		meta[key] = value;
	}
	return { meta, body: raw.slice(match[0].length).trim() };
}

// --- banner strip ---
function stripBanner(md) {
	return md.replace(/```text\n[\s\S]*?████████[\s\S]*?```\n*/g, "");
}

// --- Mintlify component → VitePress container/markdown ---
function convertComponents(source) {
	let text = source;
	// Callouts → VitePress containers
	const calloutMap = { Note: "tip", Warning: "warning", Info: "info", Tip: "tip", Check: "tip" };
	for (const [tag, container] of Object.entries(calloutMap)) {
		const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "g");
		text = text.replace(re, (_, body) => `::: ${container}\n${body.trim()}\n:::\n`);
	}
	// Steps / Step
	text = text.replace(/<Steps>\s*/g, "\n");
	text = text.replace(/<\/Steps>/g, "\n");
	text = text.replace(/<Step title="([^"]+)">\s*/g, (_, t) => `\n### ${t}\n\n`);
	text = text.replace(/<\/Step>/g, "\n");
	// CardGroup → just unwrap (cards become individual blocks)
	text = text.replace(/<CardGroup[^>]*>\s*/g, "\n");
	text = text.replace(/<\/CardGroup>/g, "\n");
	// Card → markdown link block
	text = text.replace(
		/<Card\s+title="([^"]*)"[^>]*?(?:href="([^"]*)")?[^>]*>([\s\S]*?)<\/Card>/g,
		(_, title, href, body) => {
			const desc = body.trim().replace(/\n+/g, " ");
			if (href) return `- **[${title}](${href})** — ${desc}\n`;
			return `- **${title}** — ${desc}\n`;
		},
	);
	// Self-closing Card
	text = text.replace(
		/<Card\s+title="([^"]*)"[^>]*?(?:href="([^"]*)")?[^>]*\/>/g,
		(_, title, href) => (href ? `- **[${title}](${href})**\n` : `- **${title}**\n`),
	);
	// Frame → unwrap
	text = text.replace(/<Frame[^>]*>\s*/g, "");
	text = text.replace(/<\/Frame>/g, "\n");
	// Files → code block
	text = text.replace(/<Files>\s*([\s\S]*?)<\/Files>/g, (_, body) => `\`\`\`\n${body.trim()}\n\`\`\`\n`);
	// Tabs / Tab → details
	text = text.replace(/<Tabs>\s*/g, "\n");
	text = text.replace(/<\/Tabs>/g, "\n");
	text = text.replace(/<Tab title="([^"]+)">\s*/g, (_, t) => `\n::: details ${t}\n`);
	text = text.replace(/<\/Tab>/g, "\n:::\n");
	// Accordion → details
	text = text.replace(/<Accordion title="([^"]+)">\s*/g, (_, t) => `\n::: details ${t}\n`);
	text = text.replace(/<\/Accordion>/g, "\n:::\n");
	// ParamField → table rows
	text = text.replace(
		/<ParamField name="([^"]*)" type="([^"]*)" required?(?:=(\w+))?>\s*([\s\S]*?)<\/ParamField>/g,
		(_, name, type, req, body) =>
			`| \`${name}\` | \`${type}\` | ${req === "false" ? "No" : "Yes"} | ${body.trim().replace(/\n+/g, " ")} |\n`,
	);
	// ResponseField → table rows
	text = text.replace(
		/<ResponseField name="([^"]*)" type="([^"]*)">\s*([\s\S]*?)<\/ResponseField>/g,
		(_, name, type, body) => `| \`${name}\` | \`${type}\` | ${body.trim().replace(/\n+/g, " ")} |\n`,
	);
	// Strip any remaining unknown JSX tags
	text = text.replace(/<\/?[A-Z][a-zA-Z]*[^>]*>/g, "");
	return text;
}

// --- link rewriting (absolute /docs/* → relative) ---
function rewriteLinks(md, fromSlug) {
	// /docs/sdk/foo → relative path to sdk/foo.md
	const fromDir = fromSlug.includes("/") ? fromSlug.slice(0, fromSlug.lastIndexOf("/") + 1) : "";
	return md
		.replace(/\[([^\]]+)\]\(\/docs\/sdk\/([^)#]+)(#[^)]+)?\)/g, (_, label, slug, hash) => {
			const target = `sdk/${slug}`;
			const rel = path.relative(fromDir || ".", target).replace(/\\/g, "/").replace(/^\.\//, "");
			return `[${label}](${rel}${hash || ""})`;
		})
		.replace(/\[([^\]]+)\]\(\/docs\/([^)#]+)(#[^)]+)?\)/g, (_, label, slug, hash) => {
			const rel = path.relative(fromDir || ".", slug).replace(/\\/g, "/").replace(/^\.\//, "");
			return `[${label}](${rel}${hash || ""})`;
		})
		.replace(/\[([^\]]+)\]\(\/engine\/([^)#]+)(#[^)]+)?\)/g, (_, label, slug, hash) => {
			const target = `sdk/${slug}`;
			const rel = path.relative(fromDir || ".", target).replace(/\\/g, "/").replace(/^\.\//, "");
			return `[${label}](${rel}${hash || ""})`;
		})
		.replace(/\[([^\]]+)\]\(\/([^)#/][^)#]*)(#[^)]+)?\)/g, (_, label, slug, hash) => {
			// Root-relative (not /docs/) → treat as docs page
			if (slug.startsWith("http") || slug.startsWith("mailto")) return `[${label}](${slug}${hash || ""})`;
			const rel = path.relative(fromDir || ".", slug).replace(/\\/g, "/").replace(/^\.\//, "");
			return `[${label}](${rel}${hash || ""})`;
		});
}

// --- strip broken image refs (Mintlify-hosted assets that don't exist locally) ---
function stripImages(text) {
	return text
		.replace(/!\[[^\]]*\]\(\/assets\/[^)]*\)/g, "")
		.replace(/<img[^>]*src=["']\/assets\/[^"']*["'][^>]*>/g, "")
		.replace(/<img[^>]*src=\/assets\/[^ >]*[^>]*>/g, "");
}

// --- escape Vue interpolation outside code blocks ---
function escapeInterpolation(text) {
	const blocks = [];
	let protected_ = text.replace(/```[\s\S]*?```/g, (m) => { blocks.push(m); return `\x00B${blocks.length - 1}\x00`; });
	const inlines = [];
	protected_ = protected_.replace(/`[^`]+`/g, (m) => { inlines.push(m); return `\x00I${inlines.length - 1}\x00`; });
	protected_ = protected_.replace(/\{\{/g, "&#123;&#123;").replace(/\}\}/g, "&#125;&#125;");
	protected_ = protected_.replace(/\x00I(\d+)\x00/g, (_, i) => inlines[Number(i)]);
	protected_ = protected_.replace(/\x00B(\d+)\x00/g, (_, i) => blocks[Number(i)]);
	return protected_;
}

// --- normalize ---
function normalize(md) {
	return md
		.replace(/^[ \t]+(#{1,4}\s)/gm, "$1")
		.replace(/^[ \t]+```/gm, "```")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

// --- convert a single MDX file ---
function convertMdx(filePath, slug) {
	const raw = fs.readFileSync(filePath, "utf-8");
	const { meta, body } = parseFrontmatter(raw);
	const stripped = stripBanner(body);
	const noImages = stripImages(stripped);
	const components = convertComponents(noImages);
	const linked = rewriteLinks(components, slug);
	const escaped = escapeInterpolation(linked);
	const normalized = normalize(escaped);
	const title = meta.title || meta.sidebarTitle || slug;
	const description = meta.description || "";
	const fm = [`---`, `title: ${JSON.stringify(title)}`, `description: ${JSON.stringify(description)}`, `---`, ""].join("\n");
	return fm + normalized + "\n";
}

// --- walk all .mdx files ---
function walkMdx(dir) {
	const results = [];
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) results.push(...walkMdx(full));
		else if (entry.name.endsWith(".mdx")) results.push(full);
	}
	return results;
}

// --- build sidebar from docs.json ---
function buildSidebar(docsJson) {
	const sidebar = {};
	for (const tab of docsJson.navigation?.tabs || []) {
		const tabName = tab.tab;
		const items = [];
		for (const group of tab.groups || []) {
			const groupItems = [];
			for (const page of group.pages || []) {
				if (typeof page === "string") {
					groupItems.push({ text: slugToTitle(page), link: `/${page}` });
				} else if (page.slug) {
					groupItems.push({ text: page.title || slugToTitle(page.slug), link: `/${page.slug}` });
				}
			}
			if (groupItems.length) {
				items.push({
					text: group.group || tabName,
					collapsed: false,
					items: groupItems,
				});
			}
		}
		// Also handle top-level pages (not in a group)
		for (const page of tab.pages || []) {
			if (typeof page === "string") {
				items.unshift({ text: slugToTitle(page), link: `/${page}` });
			} else if (page.slug) {
				items.unshift({ text: page.title || slugToTitle(page.slug), link: `/${page.slug}` });
			}
		}
		sidebar[`/${tabName.toLowerCase()}/`] = items;
		// Also use as the default sidebar
		if (tabName === "Trumbo") sidebar["/"] = items;
	}
	return sidebar;
}

function slugToTitle(slug) {
	return slug
		.split("/")
		.pop()
		.replace(/-/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

// --- main ---
const docsJson = JSON.parse(fs.readFileSync(path.join(BOOK_DIR, "docs.json"), "utf-8"));
const mdxFiles = walkMdx(BOOK_DIR);

// Pages excluded from the shipped product (matches build-docs.mjs exclusion list).
const EXCLUDED_PREFIXES = ["enterprise-solutions/", "api/", "kanban/"];
const EXCLUDED_SLUGS = new Set([
	"getting-started/trumbopass",
	"getting-started/trumbo-provider",
	"usage/ide",
	"features/auto-approve",
	"features/auto-compact",
	"features/jupyter-notebooks",
	"features/multiroot-workspace",
]);
function isExcluded(slug) {
	if (EXCLUDED_SLUGS.has(slug)) return true;
	return EXCLUDED_PREFIXES.some((p) => slug.startsWith(p));
}

let count = 0;
let skipped = 0;

for (const mdxFile of mdxFiles) {
	const rel = path.relative(BOOK_DIR, mdxFile).replace(/\\/g, "/");
	const slug = rel.replace(/\.mdx$/, "");
	const normalizedSlug = slug.replace(/^engine\//, "sdk/");
	if (isExcluded(normalizedSlug)) {
		skipped++;
		continue;
	}
	const outPath = path.join(OUT_DIR, `${normalizedSlug}.md`);
	fs.mkdirSync(path.dirname(outPath), { recursive: true });
	const converted = convertMdx(mdxFile, normalizedSlug);
	fs.writeFileSync(outPath, converted);
	count++;
}

// Generate sidebar
fs.mkdirSync(path.dirname(SIDEBAR_OUT), { recursive: true });
const sidebar = buildSidebar(docsJson);
fs.writeFileSync(SIDEBAR_OUT, JSON.stringify(sidebar, null, "\t"));

console.log(`Converted ${count} MDX files to VitePress Markdown.`);
console.log(`Sidebar written to ${path.relative(DOCS_ROOT, SIDEBAR_OUT)}.`);
