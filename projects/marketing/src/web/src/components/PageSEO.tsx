import { useEffect } from "react";
import {
	absoluteUrl,
	DEFAULT_DESCRIPTION,
	DEFAULT_OG_IMAGE,
	formatPageTitle,
	HOME_JSON_LD,
	resolveStaticPageSEO,
	SITE_NAME,
	type PageSEOConfig,
} from "@/lib/seo";

export type PageSEOProps = PageSEOConfig & {
	path?: string;
	jsonLd?: Record<string, unknown> | Record<string, unknown>[];
};

function upsertMeta(
	selector: string,
	create: () => HTMLElement,
	content: string,
) {
	let element = document.head.querySelector(selector);
	if (!element) {
		element = create();
		document.head.appendChild(element);
	}
	element.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
	let element = document.head.querySelector(`link[rel="${rel}"]`);
	if (!element) {
		element = document.createElement("link");
		element.setAttribute("rel", rel);
		document.head.appendChild(element);
	}
	element.setAttribute("href", href);
}

function upsertJsonLd(jsonLd: Record<string, unknown> | Record<string, unknown>[]) {
	const id = "trumbo-page-jsonld";
	let element = document.getElementById(id);
	if (!element) {
		const script = document.createElement("script");
		script.id = id;
		script.type = "application/ld+json";
		document.head.appendChild(script);
		element = script;
	}
	element.textContent = JSON.stringify(jsonLd);
}

function removeJsonLd() {
	document.getElementById("trumbo-page-jsonld")?.remove();
}

export function PageSEO({
	title,
	description = DEFAULT_DESCRIPTION,
	titleOnly = false,
	noIndex = false,
	type = "website",
	image = DEFAULT_OG_IMAGE,
	path = "/",
	jsonLd,
}: PageSEOProps) {
	useEffect(() => {
		const pageTitle = formatPageTitle(title, titleOnly);
		const canonicalUrl = absoluteUrl(path);

		document.title = pageTitle;

		upsertMeta(
			'meta[name="description"]',
			() => {
				const meta = document.createElement("meta");
				meta.name = "description";
				return meta;
			},
			description,
		);

		upsertMeta(
			'meta[name="robots"]',
			() => {
				const meta = document.createElement("meta");
				meta.name = "robots";
				return meta;
			},
			noIndex ? "noindex, nofollow" : "index, follow",
		);

		upsertLink("canonical", canonicalUrl);

		const ogTags: Array<[string, string]> = [
			["og:site_name", SITE_NAME],
			["og:title", pageTitle],
			["og:description", description],
			["og:url", canonicalUrl],
			["og:type", type],
			["og:image", image],
		];

		for (const [property, content] of ogTags) {
			upsertMeta(
				`meta[property="${property}"]`,
				() => {
					const meta = document.createElement("meta");
					meta.setAttribute("property", property);
					return meta;
				},
				content,
			);
		}

		const twitterTags: Array<[string, string]> = [
			["twitter:card", "summary_large_image"],
			["twitter:title", pageTitle],
			["twitter:description", description],
			["twitter:image", image],
		];

		for (const [name, content] of twitterTags) {
			upsertMeta(
				`meta[name="${name}"]`,
				() => {
					const meta = document.createElement("meta");
					meta.name = name;
					return meta;
				},
				content,
			);
		}

		upsertMeta(
			'meta[name="theme-color"]',
			() => {
				const meta = document.createElement("meta");
				meta.name = "theme-color";
				return meta;
			},
			"#2BBF77",
		);

		if (jsonLd) {
			upsertJsonLd(jsonLd);
		} else {
			removeJsonLd();
		}

		return () => {
			removeJsonLd();
		};
	}, [description, image, jsonLd, noIndex, path, title, titleOnly, type]);

	return null;
}

export function RouteSEO({ pathname }: { pathname: string }) {
	const config = resolveStaticPageSEO(pathname);
	if (!config) {
		return null;
	}

	return (
		<PageSEO
			{...config}
			path={pathname}
			jsonLd={pathname === "/" ? HOME_JSON_LD : undefined}
		/>
	);
}
