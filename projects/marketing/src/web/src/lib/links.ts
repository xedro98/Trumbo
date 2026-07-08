export const PLATFORM_URL = "https://platform.trumbo.dev";

export const platformLink = (path = "/") =>
	`${PLATFORM_URL}${path.startsWith("/") ? path : `/${path}`}`;
