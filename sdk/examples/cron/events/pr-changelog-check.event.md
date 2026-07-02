---
id: pr-changelog-check
title: Check for Changelog Updates in PRs
workspaceRoot: /absolute/path/to/repo
event: github.pull_request.opened
filters:
  repository: your-org/your-repo
  pullRequest:
    baseBranch: main
debounceSeconds: 10
cooldownSeconds: 60
maxParallel: 3
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
tags:
  - automation
  - github
  - documentation
metadata:
  owner: development
---
A pull request just opened against `main`. Check whether it deserves a
changelog entry and leave a comment on the PR.

1. Did the PR touch source files (`src/`, `lib/`, and similar)?
2. Did it also update `CHANGELOG.md` (or the relevant per-package changelog)?

If there are meaningful code changes but no changelog edit:

- Summarize what changed.
- Suggest the entry the author should add.
- Ask them to add it before merge.

If the changelog was updated:

- Check the entry matches the project's existing format.
- Check it's concise and user-facing.
- Check the version label is sensible.

Post a single PR comment using one of these verdicts:

- ✅ CHANGELOG updated correctly.
- ⚠️ No CHANGELOG changes detected — please add an entry.
- 🤔 CHANGELOG entry format looks off — consider [example].

The goal is an up-to-date changelog without anyone having to nag authors
manually.
