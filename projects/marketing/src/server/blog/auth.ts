import type { D1Database } from "@cloudflare/workers-types";

const SESSION_COOKIE = "trumbo_blog_admin";
const SESSION_DAYS = 7;

function json(data: unknown, init: ResponseInit = {}): Response {
	const headers = new Headers(init.headers);
	if (!headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}
	return new Response(JSON.stringify(data), { ...init, headers });
}

function parseCookies(request: Request): Record<string, string> {
	const header = request.headers.get("Cookie") ?? "";
	const cookies: Record<string, string> = {};
	for (const part of header.split(";")) {
		const [rawKey, ...rest] = part.trim().split("=");
		if (!rawKey) continue;
		cookies[rawKey] = decodeURIComponent(rest.join("="));
	}
	return cookies;
}

function sessionExpiry(): string {
	const date = new Date();
	date.setDate(date.getDate() + SESSION_DAYS);
	return date.toISOString();
}

function randomToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function createSession(db: D1Database, userId: number): Promise<string> {
	const token = randomToken();
	await db
		.prepare("INSERT INTO admin_sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
		.bind(token, userId, sessionExpiry())
		.run();
	return token;
}

export async function deleteSession(db: D1Database, token: string): Promise<void> {
	await db.prepare("DELETE FROM admin_sessions WHERE token = ?").bind(token).run();
}

export async function getSessionUser(
	db: D1Database,
	token: string | undefined,
): Promise<{ id: number; email: string } | null> {
	if (!token) return null;
	const row = await db
		.prepare(
			`SELECT s.expires_at, u.id, u.email
			 FROM admin_sessions s
			 JOIN admin_users u ON u.id = s.user_id
			 WHERE s.token = ?`,
		)
		.bind(token)
		.first<{ expires_at: string; id: number; email: string }>();
	if (!row) return null;
	if (new Date(row.expires_at).getTime() < Date.now()) {
		await deleteSession(db, token);
		return null;
	}
	return { id: row.id, email: row.email };
}

export async function isValidSession(db: D1Database, token: string | undefined): Promise<boolean> {
	return (await getSessionUser(db, token)) != null;
}

export function readSessionToken(request: Request): string | undefined {
	return parseCookies(request)[SESSION_COOKIE];
}

export function sessionCookie(token: string): string {
	const maxAge = SESSION_DAYS * 24 * 60 * 60;
	return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearSessionCookie(): string {
	return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`;
}

export async function requireAdmin(request: Request, db: D1Database): Promise<Response | null> {
	const token = readSessionToken(request);
	if (!(await isValidSession(db, token))) {
		return json({ error: "Unauthorized" }, { status: 401 });
	}
	return null;
}

export { json };
