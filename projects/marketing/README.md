# Trumbo Marketing Site

Static marketing SPA for **trumbo.dev**, separate from the authenticated platform at **platform.trumbo.dev**.

## Stack

- Vite + React 19 + Tailwind v4 + [@cloudflare/kumo](https://developers.cloudflare.com/kumo/)
- Cloudflare Workers (asset binding + SPA fallback)
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

Requires Cloudflare credentials and `trumbo.dev` / `www.trumbo.dev` custom domains on the `trumbo-marketing` worker.

## Redirects

The worker forwards `/login`, `/register`, `/dashboard`, `/billing`, `/docs`, and `/app/*` to `platform.trumbo.dev`.
