---
id: changelog-generator
title: Auto-Generate Changelog from Commits
workspaceRoot: /absolute/path/to/repo
schedule: "0 18 * * FRI"
tools: run_commands,read_files,editor
mode: act
enabled: false
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 1800
maxIterations: 20
tags:
  - automation
  - changelog
  - documentation
metadata:
  owner: development
  targetFile: apps/cli/CHANGELOG.md
  trackDirectory: apps/cli
---
Look at the commits landed in `apps/cli` since the last entry in `CHANGELOG.md`.
Group them into user-facing changes: new features, fixes, and breaking changes.
Skip internal refactors that a user would never notice.

Prepend a new entry at the top of `apps/cli/CHANGELOG.md` using this shape:

## [VERSION] (YYYY-MM-DD)

- Feature: [description]
- Fix: [description]
- Breaking: [description]

Rules:

- Do not bump the version in `package.json`. The release process owns that.
- Do not overwrite or rewrite existing entries.
- Match the tone and formatting of the entries already in the file.
- If a commit is ambiguous, describe what it changed for users, not the
  implementation detail.
