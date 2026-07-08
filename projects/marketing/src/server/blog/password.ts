const PBKDF2_ITERATIONS = 100_000;
const SALT_BYTES = 16;
const KEY_BYTES = 32;

function toHex(bytes: Uint8Array): string {
	return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function fromHex(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let index = 0; index < bytes.length; index += 1) {
		bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
	}
	return bytes;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations: PBKDF2_ITERATIONS,
			hash: "SHA-256",
		},
		keyMaterial,
		KEY_BYTES * 8,
	);
	return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
	const hash = await deriveKey(password, salt);
	return `pbkdf2-sha256:${PBKDF2_ITERATIONS}:${toHex(salt)}:${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [scheme, iterationsRaw, saltHex, hashHex] = stored.split(":");
	if (scheme !== "pbkdf2-sha256" || !iterationsRaw || !saltHex || !hashHex) {
		return false;
	}
	const iterations = Number(iterationsRaw);
	if (!Number.isFinite(iterations) || iterations <= 0) {
		return false;
	}

	const salt = fromHex(saltHex);
	const expected = fromHex(hashHex);
	const keyMaterial = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(password),
		"PBKDF2",
		false,
		["deriveBits"],
	);
	const bits = await crypto.subtle.deriveBits(
		{
			name: "PBKDF2",
			salt,
			iterations,
			hash: "SHA-256",
		},
		keyMaterial,
		expected.length * 8,
	);
	const actual = new Uint8Array(bits);
	if (actual.length !== expected.length) {
		return false;
	}
	let mismatch = 0;
	for (let index = 0; index < actual.length; index += 1) {
		mismatch |= actual[index] ^ expected[index];
	}
	return mismatch === 0;
}
