---
id: local-plugin-event
title: Local Plugin Event
workspaceRoot: /absolute/path/to/repo
cwd: /absolute/path/to/repo
event: local.plugin_event
filters:
  topic: plugin-demo
dedupeWindowSeconds: 5
cooldownSeconds: 5
maxParallel: 1
tags:
  - local
  - plugin
  - automation
metadata:
  source: examples/plugins/automation-events.ts
---
A plugin-emitted event has arrived. Read it from the run context and report the
event subject, topic, and message payload so the operator can confirm the plugin
event path is working end to end.
