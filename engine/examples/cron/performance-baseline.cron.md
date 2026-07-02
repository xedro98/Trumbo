---
id: performance-baseline
title: Track Performance Metrics
workspaceRoot: /absolute/path/to/repo
schedule: "0 2 * * *"
tools: run_commands,read_files,editor
mode: act
enabled: false
modelSelection:
  providerId: trumbo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 2400
maxIterations: 20
tags:
  - automation
  - performance
  - monitoring
metadata:
  owner: platform
  metricsFile: .perf-baseline.json
---
Measure the project's performance baseline and record it for trend tracking.

1. Build the project and capture build time: `npm run build`.
2. Bundle size, if the project ships a bundle — run the bundler with size
   reporting on.
3. Cold start time, if this is a CLI or server.
4. Any existing benchmarks the repo already ships.

Write or update `.perf-baseline.json`:

```json
{
  "timestamp": "ISO-8601",
  "buildTime": "milliseconds",
  "bundleSize": "bytes",
  "coldStart": "milliseconds",
  "metrics": {...}
}
```

Compare against the previous baseline and flag regressions:

- Build time up more than 10% → warning.
- Bundle size up more than 5% → concern.
- Anything else that moved the wrong direction → note it.

Close with concrete optimization suggestions for any regression you flagged.
