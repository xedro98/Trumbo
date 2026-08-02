export const PLATFORM_URL = "https://platform.trumbo.dev";

export const platformLink = (path = "/") =>
	`${PLATFORM_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** VS Code Marketplace listing for the Trumbo extension (publisher `trumbo`, name `trumbo`). */
export const VSCODE_MARKETPLACE_URL =
	"https://marketplace.visualstudio.com/items?itemName=trumbo.trumbo";

/** Desktop app releases (macOS / Windows / Linux installers). */
export const DESKTOP_DOWNLOAD_URL = "https://github.com/xedro98/Trumbo/releases/latest";
