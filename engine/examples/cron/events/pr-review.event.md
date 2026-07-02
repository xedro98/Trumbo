---
id: pr-review
title: Review New Pull Requests
workspaceRoot: /absolute/path/to/repo
cwd: /absolute/path/to/repo
event: github.pull_request.opened
filters:
  repository: acme/api
  pullRequest:
    baseBranch: main
debounceSeconds: 30
dedupeWindowSeconds: 600
cooldownSeconds: 120
maxParallel: 2
mode: act
enabled: true
modelSelection:
  providerId: trumbo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 1800
maxIterations: 20
tags:
  - automation
  - github
  - review
metadata:
  owner: platform
  source: normalized-event-ingress
---
A new pull request was opened. Read it from the trigger event context and review
it. Call out the highest-risk changes, note any missing tests or migration
risks, and tell the author the single most important next step. Keep it short
and reviewer-shaped — lead with risk, not with a recap of the diff.
