import type { D1Database } from "@cloudflare/workers-types";
import { hashPassword, verifyPassword } from "./password";

export type AdminUser = {
	id: number;
	email: string;
};

function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

export async function getUserByEmail(db: D1Database, email: string): Promise<(AdminUser & { password_hash: string }) | null> {
	return db
		.prepare("SELECT id, email, password_hash FROM admin_users WHERE email = ? COLLATE NOCASE")
		.bind(normalizeEmail(email))
		.first<AdminUser & { password_hash: string }>();
}

export async function createAdminUser(db: D1Database, email: string, password: string): Promise<AdminUser> {
	const normalized = normalizeEmail(email);
	const passwordHash = await hashPassword(password);
	await db
		.prepare("INSERT INTO admin_users (email, password_hash) VALUES (?, ?)")
		.bind(normalized, passwordHash)
		.run();
	const user = await db
		.prepare("SELECT id, email FROM admin_users WHERE email = ?")
		.bind(normalized)
		.first<AdminUser>();
	if (!user) {
		throw new Error("Failed to create admin user");
	}
	return user;
}

export async function verifyAdminLogin(
	db: D1Database,
	email: string,
	password: string,
): Promise<AdminUser | null> {
	const user = await getUserByEmail(db, email);
	if (!user) return null;
	const valid = await verifyPassword(password, user.password_hash);
	if (!valid) return null;
	return { id: user.id, email: user.email };
}

export async function ensureAdminUser(
	db: D1Database,
	email: string | undefined,
	password: string | undefined,
): Promise<void> {
	if (!email || !password) return;

	const existing = await getUserByEmail(db, email);
	if (existing) return;

	await createAdminUser(db, email, password);
}
