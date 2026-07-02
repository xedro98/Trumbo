---
id: dependency-check
title: Weekly Dependency Health Check
workspaceRoot: /absolute/path/to/repo
schedule: "0 10 * * MON"
tools: run_commands,read_files
mode: act
enabled: false
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 1800
maxIterations: 15
tags:
  - automation
  - security
  - dependencies
metadata:
  owner: platform
---
Run a weekly health check on the dependency tree.

1. Outdated packages: `npm outdated` (or the yarn/pnpm equivalent).
2. Vulnerabilities: `npm audit`.
3. Packages with a major version upgrade available.
4. Dependencies that appear unused, if you can determine it safely.
5. Conflicts or duplicate versions of the same package.

Summarize for the team:

- Critical security advisories, if any — these go first.
- Outdated counts broken down by minor/patch/major.
- Packages that are safe to bump to latest today.
- Recommended actions, ordered by urgency.

Keep it actionable. Ignore known false positives and dev-only dependencies that
don't ship.
