import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitepress";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sidebar = JSON.parse(readFileSync(join(__dirname, "sidebar.json"), "utf-8"));

export default defineConfig({
	title: "Trumbo",
	description: "Trumbo documentation — AI-powered coding agent for complex work",
	lang: "en-US",
	cleanUrls: true,
	lastUpdated: true,
	ignoreDeadLinks: true,
	head: [
		["meta", { name: "theme-color", content: "#2BBF77" }],
		["link", { rel: "icon", href: "/trumbo-logo.svg", type: "image/svg+xml" }],
		["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
		["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
		[
			"link",
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap",
			},
		],
	],
	themeConfig: {
		siteTitle: "Trumbo Docs",
		logo: {
			light: "/trumbo-logo.svg",
			dark: "/trumbo-logo.svg",
			alt: "Trumbo",
		},
		nav: [
			{ text: "Platform", link: "/platform/overview" },
			{ text: "API", link: "/api/overview" },
			{ text: "SDK", link: "/sdk/overview" },
			{ text: "GitHub", link: "https://github.com/xedro98/Trumbo" },
			{ text: "Open Platform", link: "https://platform.trumbo.dev" },
		],
		sidebar: sidebar,
		socialLinks: [{ icon: "github", link: "https://github.com/xedro98/Trumbo" }],
		search: { provider: "local" },
		footer: {
			message: "Released under the MIT License.",
			copyright: "Copyright © 2026 Maxfense, Inc",
		},
		outline: { level: [2, 3], label: "On this page" },
		docFooter: { prev: "Previous", next: "Next" },
		darkModeSwitchLabel: "Appearance",
		sidebarMenuLabel: "Menu",
		returnToTopLabel: "Back to top",
	},
});
