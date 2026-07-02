# SDK conventions

Conventions for working against the Trembo SDK (`@trembo/core`, `@trembo/llms`, `@trembo/agents`, `@trembo/shared`).

1. **Look up SDK APIs, don't guess.** Use `kb_search(name="sdk", query="...")` before implementing against an SDK surface.
2. **Use `{appBaseUrl}`**, never hardcode `app.example.invalid`.
3. **Avoid `as` casts.** Use explicit conversion functions with tests. The branded types in the model-catalog contracts exist so casts are unnecessary outside parse/compute boundaries.
