---
id: code-style-audit
title: Code Style and Linting Audit
workspaceRoot: /absolute/path/to/repo
schedule: "0 3 * * WED"
tools: run_commands,read_files
mode: act
enabled: false
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 1800
maxIterations: 20
tags:
  - automation
  - quality
  - style
metadata:
  owner: development
  reportFormat: markdown
---
Run the project's style and lint tooling and summarize what it finds.

1. Lint: `npm run lint` (or `eslint .` if no script exists).
2. Format check: `prettier --check .` or the project's equivalent.
3. Scan for common smells that linters miss:
   - Unused variables and imports.
   - Dead code paths.
   - `TODO`/`FIXME` left on the main branch.
   - `console.log` (and similar) in production code.
   - Magic numbers with no explaining comment.

Produce a report with:

- Top 10 violations by rule.
- Files with the most violations.
- Formatting drift.
- Pattern notes — e.g. recurring TODO reasons, common unused-import sources.

Then give the numbers:

- Total violations.
- Auto-fixable vs. needs-human-judgment.
- Week-over-week trend if a previous report is available.

Finish with three buckets of next steps: quick wins (auto-fixable), standards to
lock in (patterns to enforce), and review-needed (complex issues you can't
safely auto-resolve).
