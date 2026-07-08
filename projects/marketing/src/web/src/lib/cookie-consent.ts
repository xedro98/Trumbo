export const COOKIE_CONSENT_STORAGE_KEY = "trumbo-marketing-cookie-consent";

export function hasCookieConsent(): boolean {
	if (typeof window === "undefined") {
		return true;
	}

	try {
		return localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) === "accepted";
	} catch {
		return true;
	}
}

export function persistCookieConsent() {
	try {
		localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "accepted");
	} catch {
		// ignore storage errors
	}
}
