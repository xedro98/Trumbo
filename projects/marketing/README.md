# Trumbo Marketing Site

Static marketing SPA for **trumbo.dev**, separate from the authenticated platform at **platform.trumbo.dev**.

## Stack

- Vite + React 19 + Tailwind v4 + Kumo components
- Trumbo edge runtime (asset binding + SPA fallback)
- Same brand tokens as the web app (`#2BBF77`, Geist/Geist Mono)

## Layout

Poolside-inspired: fixed left sidebar, scrollable main content with hero, product cards, developers, platform, research, and watermark footer.

## Development

```bash
cd projects/marketing
npm install
npm run dev
```

Opens on http://localhost:5174

## Deploy

```bash
npm run deploy
```

Requires infrastructure credentials and the `trumbo.dev` / `www.trumbo.dev` custom domains.

## Redirects

The worker forwards `/login`, `/register`, `/dashboard`, `/billing`, `/docs`, and `/app/*` to `platform.trumbo.dev`.
