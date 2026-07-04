#!/usr/bin/env bun
/**
 * Dev entrypoint for `bun run dev`. Sets TRUMBO_BUILD_ENV before loading the
 * CLI so @trumbo/shared resolves local web/API URLs (localhost) instead of
 * production (platform.trumbo.dev).
 */
process.env.TRUMBO_BUILD_ENV ??= "development";
await import("../src/index.ts");
