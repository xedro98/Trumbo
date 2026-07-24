/**
 * UUIDv7 generation (RFC 9562).
 *
 * UUIDv7 encodes a 48-bit Unix millisecond timestamp in the high bits, so ids
 * sort lexicographically by creation time. Used for request ids that need to
 * be both unique and time-ordered (e.g. provider request tracking, where
 * time-ordered ids make deduplication and log correlation trivial).
 *
 * The random portion (74 bits after subtracting version/variant) is filled
 * with `crypto.getRandomValues`, which is available in both Node and browser
 * runtimes.
 */

/**
 * Generate a new UUIDv7 string (lowercase, canonical 8-4-4-4-12 format).
 *
 * @example
 * ```ts
 * const id = uuidV7(); // "0192f8a3-7b1c-7d2e-9a3f-1234567890ab"
 * ```
 */
export function uuidV7(): string {
	const bytes = new Uint8Array(16);
	crypto.getRandomValues(bytes);

	// 48-bit Unix timestamp (ms) in the first 6 bytes.
	const now = Date.now();
	bytes[0] = Math.floor(now / 0x10000000000) & 0xff;
	bytes[1] = Math.floor(now / 0x100000000) & 0xff;
	bytes[2] = Math.floor(now / 0x1000000) & 0xff;
	bytes[3] = Math.floor(now / 0x10000) & 0xff;
	bytes[4] = Math.floor(now / 0x100) & 0xff;
	bytes[5] = now & 0xff;

	// Version 7 (0111xxxx) in the upper nibble of byte 6.
	bytes[6] = (bytes[6] & 0x0f) | 0x70;
	// Variant (10xxxxxx) in the upper two bits of byte 8.
	bytes[8] = (bytes[8] & 0x3f) | 0x80;

	const toHex = (b: number): string => b.toString(16).padStart(2, "0");
	return (
		`${toHex(bytes[0])}${toHex(bytes[1])}` +
		`${toHex(bytes[2])}${toHex(bytes[3])}` +
		`-${toHex(bytes[4])}${toHex(bytes[5])}` +
		`-${toHex(bytes[6])}${toHex(bytes[7])}` +
		`-${toHex(bytes[8])}${toHex(bytes[9])}` +
		`-${toHex(bytes[10])}${toHex(bytes[11])}` +
		`${toHex(bytes[12])}${toHex(bytes[13])}` +
		`${toHex(bytes[14])}${toHex(bytes[15])}`
	);
}

/**
 * Minimal validation that a string is a plausible UUIDv7. Checks the version
 * nibble (7) and the canonical format. Does not verify the timestamp is in a
 * sane range.
 */
export function isUuidV7(value: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
		value,
	);
}
