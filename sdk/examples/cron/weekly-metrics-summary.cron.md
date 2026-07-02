---
id: weekly-metrics-summary
title: Weekly Project Metrics Summary
workspaceRoot: /absolute/path/to/repo
schedule: "0 17 * * FRI"
tools: run_commands,read_files,search_codebase
mode: act
enabled: false
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 1800
maxIterations: 20
tags:
  - automation
  - metrics
  - team
metadata:
  owner: leadership
  reportFormat: markdown
---
Put together a weekly metrics summary the team will actually read. Pull the last
seven days and turn it into a short, upbeat, data-backed report.

1. **Code activity**
   - Commits this week.
   - Lines added and deleted.
   - Most active contributors.
   - Most-modified files.

2. **Quality**
   - Test pass rate.
   - Coverage trend (up or down, by how much).
   - Issues introduced versus fixed.
   - Type-check error trend.

3. **Performance**
   - Build time trend.
   - Bundle size change.
   - Any regressions detected.

4. **Pull requests**
   - Opened versus closed.
   - Average review time.
   - PRs per author.
   - Most-reviewed files.

5. **Velocity**
   - Story points completed, if the team uses them.
   - Bugs fixed versus features added.
   - On-schedule versus blocked work.

Write it as a markdown report with a celebratory but honest tone:

- 🏆 Top contributor of the week.
- 📈 Metrics trending up or down, with arrows.
- 🎯 The week's accomplishments.
- ⚠️ Metrics that need attention.
- 💡 One or two insights ("Build time dropped 6% this week").
- 🔥 Hot spots — the files touched most often.

Sprinkle in a few fun facts: most commits in a single day, the most-reviewed PR,
most bug fixes by one person. Keep it light but grounded in the numbers —
perfect for a Friday standup or team channel.
