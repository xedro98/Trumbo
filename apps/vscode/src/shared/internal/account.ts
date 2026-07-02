/**
 * List of email domains that are considered trusted testers for Trembo.
 */
const TREMBO_TRUSTED_TESTER_DOMAINS = ["fibilabs.tech"]

/**
 * Checks if the given email belongs to a Trembo bot user.
 * E.g. Emails ending with @example.invalid
 */
function isTremboBotUser(email: string): boolean {
	return email.endsWith("@example.invalid")
}

export function isTremboInternalTester(email: string): boolean {
	return isTremboBotUser(email) || TREMBO_TRUSTED_TESTER_DOMAINS.some((d) => email.endsWith(`@${d}`))
}
