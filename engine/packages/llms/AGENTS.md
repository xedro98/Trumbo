---
description: Development guidance for the @trumbo/llms package.
globs: "src/**/*.ts,src/**/*.tsx,*.md"
alwaysApply: true
---
```text
████████╗██████╗ ██╗   ██╗███╗   ███╗██████╗  ██████╗ 
╚══██╔══╝██╔══██╗██║   ██║████╗ ████║██╔══██╗██╔═══██╗
   ██║   ██████╔╝██║   ██║██╔████╔██║██████╔╝██║   ██║
   ██║   ██╔══██╗██║   ██║██║╚██╔██║██╔══██╗██║   ██║
   ██║   ██║  ██║╚██████╔╝██║ ╚═╝ ██║██████╔╝╚██████╔╝
   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═════╝  ╚═════╝ 
```


# @trumbo/llms Development Guidance

## Provider Option Routing

- `models.dev` catalog data and AI SDK provider behavior are the default sources of truth for general model/provider support.
- Do not build a broad Trumbo-maintained model capability or behavior registry.
- `GatewayModelCapability` is semantic: it describes what the model can do, not provider quirks, default behavior, or wire-format details.
- Stable, reliable known-model facts belong in typed `ModelInfo.metadata` helpers or `src/providers/model-facts.ts`.
- Stable provider routing facts belong in `GatewayProviderMetadata.routing` and the relevant builtin provider manifest. For example, if a native provider uses a known reasoning wire format for a model route, add a typed `GatewayReasoningFormat` value and route metadata instead of matching that provider id directly in a rule predicate.
- Provider wire-format encoding belongs in `PROVIDER_OPTION_RULES` and codec helpers under `src/providers/routing`.
- Local or dynamic provider fallbacks, such as Ollama or routed model-id heuristics, are allowed only as documented, narrowly scoped, tested exceptions.
- Fallback heuristics need negative or graceful-degradation tests, not only happy-path tests.

When changing provider options, keep the split explicit:

```text
request intent + model/provider facts -> named provider-option rule -> provider wire format
```

If the same fact-resolution logic is needed across several providers, reach for a shared helper first. Add a new registry only after repeated logic proves the rule table and helpers are no longer enough.
