---
name: documentation
description: Write clear technical documentation — READMEs, API docs, architecture guides, and inline comments.
---

# Documentation Skill

When writing or improving documentation, work through these principles.

## 1. Know your audience

- **README** — new developers evaluating or onboarding to the project.
- **API docs** — developers integrating with the API.
- **Architecture docs** — team members understanding the system design.
- **Inline comments** — future maintainers, including yourself in six months.

## 2. README structure

A good README answers these questions in order:

1. **What is this?** One paragraph. What problem does it solve?
2. **Quick start** — the fastest path from zero to working, with copy-pasteable
   commands.
3. **Installation** — prerequisites, install steps, configuration.
4. **Usage** — common cases with code examples.
5. **API reference** — if small enough; otherwise link to generated docs.
6. **Configuration** — every option, with defaults and descriptions.
7. **Contributing** — how to set up the dev environment, run tests, submit
   changes.
8. **License** — one line.

## 3. API documentation

For each endpoint, function, or method:

```
### functionName(param1, param2, options?)

Brief description of what it does.

**Parameters:**
- `param1` (string, required) — What this parameter controls.
- `param2` (number, optional, default: 10) — What this parameter controls.
- `options.verbose` (boolean, default: false) — Enable verbose output.

**Returns:** `Promise<Result>` — Description of the return value.

**Throws:**
- `ValidationError` — When input is invalid.
- `NotFoundError` — When the resource doesn't exist.

**Example:**
```ts
const result = await functionName("input", 5);
```
```

## 4. Architecture documentation

- Start with a high-level diagram (Mermaid, ASCII, or an image).
- Describe each component's responsibility in one sentence.
- Document data flow for the most important operations.
- List the key design decisions and their rationale.
- Note known limitations and planned improvements.

## 5. Inline comments

Write comments that explain **why**, not **what**:

- Good: `// Retry 3 times because the upstream API has transient 503s during deploys`
- Bad: `// Retry 3 times`
- Good: `// Sort descending so the most recent entry is first for the dashboard`
- Bad: `// Sort the array`

Never comment obvious code. If code needs a comment to explain what it does,
refactor the code to be self-explanatory first.

## 6. Quality checklist

Before you call the docs done:

- [ ] All code examples compile and run.
- [ ] No broken links.
- [ ] Consistent formatting and terminology.
- [ ] No stale information from previous versions.
- [ ] Spelling and grammar checked.
- [ ] Table of contents for documents longer than three sections.
