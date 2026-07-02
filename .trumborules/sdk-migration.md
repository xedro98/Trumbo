# SDK conventions

Conventions for working against the Trumbo SDK (`@trumbo/core`, `@trumbo/llms`, `@trumbo/agents`, `@trumbo/shared`).

1. **Look up SDK APIs, don't guess.** Use `kb_search(name="sdk", query="...")` before implementing against an SDK surface.
2. **Use `{appBaseUrl}`**, never hardcode `app.example.invalid`.
3. **Avoid `as` casts.** Use explicit conversion functions with tests. The branded types in the model-catalog contracts exist so casts are unnecessary outside parse/compute boundaries.
