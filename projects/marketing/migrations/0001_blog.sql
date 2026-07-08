CREATE TABLE IF NOT EXISTS blog_categories (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blog_posts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	slug TEXT NOT NULL UNIQUE,
	title TEXT NOT NULL,
	excerpt TEXT NOT NULL DEFAULT '',
	body TEXT NOT NULL DEFAULT '',
	category_id INTEGER REFERENCES blog_categories(id) ON DELETE SET NULL,
	published INTEGER NOT NULL DEFAULT 0,
	published_at TEXT,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS admin_sessions (
	token TEXT PRIMARY KEY,
	expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published, published_at DESC);
