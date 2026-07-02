---
id: daily-code-review
title: Daily Code Review
workspaceRoot: /absolute/path/to/repo
schedule: "0 9 * * MON-FRI"
tools: run_commands,read_files
mode: act
enabled: true
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 1800
systemPrompt: You are a terse automation agent. Surface only findings a reviewer can act on immediately. No preamble, no praise, no recap of the diff.
maxIterations: 20
tags:
  - automation
  - review
metadata:
  owner: platform
notesDirectory: /absolute/path/to/notes
extensions:
  - rules
  - skills
  - plugins
source: user
---
Walk the open pull requests. For each, find the highest-risk changes, run the
relevant checks if they would change your read, and write a short summary of
findings a reviewer can act on right now. Lead with risk; do not narrate the
diff.
