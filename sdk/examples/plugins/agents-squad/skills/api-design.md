---
name: api-design
description: Design clean APIs — REST, RPC, or library interfaces — with consistent naming, error handling, and versioning.
---

# API Design Skill

When designing or reviewing an API (REST, RPC, or library), work through these
principles in order.

## 1. Understand the consumer

- Who calls this API? Frontend, other services, a CLI, third-party developers?
- What are the most common operations?
- Which error conditions does the consumer need to handle?
- What's the expected request volume and latency budget?

## 2. Naming

- Use consistent, predictable names across every endpoint and method.
- Nouns for resources, verbs for actions: `GET /users`, `POST /users/:id/activate`.
- For libraries: verb-first for actions (`createUser`, `deleteSession`), noun-first
  for accessors (`getUserById`).
- Avoid abbreviations unless they're universal (`id`, `url`, `api`).
- Be specific: `getActiveUserCount()`, not `getCount()`.

## 3. Input design

- Accept the minimum required input. Give optional fields sensible defaults.
- Validate at the boundary with typed schemas (Zod, JSON Schema).
- Reject invalid input early, with a clear message.
- REST: path params for identity (`/users/:id`), query params for filtering
  (`?status=active`), body for creation and mutation.
- Libraries: prefer an options object over a long parameter list.

## 4. Output design

- Return a consistent shape. Every endpoint shares the same envelope.
- Include enough context that the consumer rarely needs a follow-up call.
- Paginate list endpoints. Always include `total`, `limit`, and `offset` or
  cursor.
- Use ISO 8601 for dates. Pick one casing (camelCase or snake_case) and stick
  to it.

## 5. Error handling

- Use standard HTTP status codes (REST) or typed error codes (RPC/library).
- Every error response includes an error code, a human-readable message, and a
  request id.
- Separate client errors (4xx / validation) from server errors (5xx / internal).
- Never leak internals (stack traces, SQL, file paths) in production errors.
- Document every error code the consumer might receive.

## 6. Versioning and evolution

- Version from day one (`/v1/`, a header, or semver for libraries).
- Additive changes (new fields, new endpoints) are non-breaking.
- Removing or renaming a field is breaking — deprecate first, remove in the
  next major version.
- Record breaking changes in a changelog.

## 7. Documentation

For each endpoint or method, document:

1. Purpose — one sentence.
2. Input parameters, with types and constraints.
3. Output shape, with an example.
4. Error codes and when they occur.
5. Authentication and authorization requirements.
6. Rate limits, if any.
