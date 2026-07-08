/**
 * List of email domains that are considered trusted testers for Trumbo.
 */
const TRUMBO_TRUSTED_TESTER_DOMAINS = ["fibilabs.tech"]

/**
 * Checks if the given email belongs to a Trumbo bot user.
 * E.g. Emails ending with @trumbo.dev
 */
function isTrumboBotUser(email: string): boolean {
	return email.endsWith("@trumbo.dev")
}

export function isTrumboInternalTester(email: string): boolean {
	return isTrumboBotUser(email) || TRUMBO_TRUSTED_TESTER_DOMAINS.some((d) => email.endsWith(`@${d}`))
}
