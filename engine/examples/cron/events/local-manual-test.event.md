---
id: local-manual-test
title: Local Manual Event Test
workspaceRoot: /absolute/path/to/repo
cwd: /absolute/path/to/repo
event: local.manual_test
filters:
  topic: cron-feature-2
debounceSeconds: 0
dedupeWindowSeconds: 60
cooldownSeconds: 0
maxParallel: 1
mode: act
enabled: true
modelSelection:
  providerId: trumbo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 300
maxIterations: 5
tags:
  - automation
  - local-test
metadata:
  owner: platform
  source: local-smoke-test
---
This is a smoke test for event-driven automation, run entirely locally with no
external service. Read the normalized trigger event from the run context and
confirm the pipeline is wired correctly. Report the event id, subject, topic,
and the payload message back in your summary so the operator can see the event
arrived intact.
