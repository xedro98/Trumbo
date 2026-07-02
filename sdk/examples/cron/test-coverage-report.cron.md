---
id: test-coverage-report
title: Generate Test Coverage Report
workspaceRoot: /absolute/path/to/repo
schedule: "0 22 * * *"
tools: run_commands,read_files
mode: act
enabled: false
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 2400
maxIterations: 25
tags:
  - automation
  - testing
  - quality
metadata:
  owner: qa
  reportFormat: markdown
---
Run the test suite, collect coverage, and write a markdown report a human can
scan in under a minute.

1. Run the full suite: `npm test` or the project's equivalent.
2. Generate coverage in JSON: `npm run test:coverage`.
3. Pull out the signals that matter:
   - Overall coverage — lines, branches, functions, statements.
   - Files under 80%.
   - Files under 50% (critical).
   - Trend versus the previous report, if one exists.

Build a markdown summary with:

- Overall metrics with visual progress bars.
- The top 5 files that most need more tests.
- Test results — total, passed, failed, skipped.
- A short list of recommendations for where to add tests next.

Use these health indicators so the report reads at a glance:

- 🟢 Excellent (>90%)
- 🟡 Good (70–90%)
- 🔴 Needs attention (<70%)
