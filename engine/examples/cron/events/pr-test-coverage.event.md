---
id: pr-test-coverage
title: Analyze Test Coverage Impact of PR
workspaceRoot: /absolute/path/to/repo
event: github.pull_request.synchronize
filters:
  repository: your-org/your-repo
  pullRequest:
    baseBranch: main
debounceSeconds: 30
cooldownSeconds: 120
maxParallel: 2
modelSelection:
  providerId: trumbo
  modelId: anthropic/claude-opus-4.7
tags:
  - automation
  - github
  - testing
metadata:
  owner: qa
  checkMetrics:
    - lineCoverage
    - branchCoverage
    - newFilesCoverage
---
A pull request targeting `main` was just updated. Measure how the change moved
coverage and leave a comment that helps the author without blocking them.

1. Check out the PR branch.
2. Run coverage: `npm run test:coverage`.
3. Compare against `main`:
   - New lines that are covered.
   - New lines that are not covered.
   - Files where coverage dropped.
   - New files with low coverage.

4. Build a coverage-impact report:
   - Coverage change as a percentage.
   - Files with newly uncovered code.
   - Critical gaps in the new functionality.
   - Concrete suggestions for the missing tests.

5. Post the results as a PR comment:
   - Overall impact, with an up or down arrow.
   - A file-by-file breakdown.
   - Specific line ranges that need tests.
   - Recommendations for what to add.

Color the verdict so it reads at a glance:

- 🟢 Coverage improved.
- 🟡 Coverage held steady.
- 🔴 Coverage dropped.
- ⚫ New code with no tests at all.

Aim to guide the author toward better test habits, not to gatekeep the PR.
