---
id: type-check-strict
title: Strict TypeScript Type Checking
workspaceRoot: /absolute/path/to/repo
schedule: "0 6 * * *"
tools: run_commands,read_files
mode: plan
enabled: false
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 1800
maxIterations: 20
tags:
  - automation
  - quality
  - typescript
metadata:
  owner: development
  strictLevel: strict
---
Run TypeScript with strict compiler options and report what falls out. Stay in
`plan` mode — propose fixes, do not apply them.

1. Run `tsc --noEmit` with strict settings.
2. Collect every error and warning.
3. Bucket the errors:
   - Missing type annotations.
   - Implicit `any`.
   - Null/undefined safety holes.
   - Generic type issues.
   - Import/export mismatches.

Report:

- Total type errors.
- Error counts per category.
- Top 10 files by error count.
- A specific suggestion per category.

Then call out where tightening types would pay off: files that would benefit
from JSDoc, places where an explicit type would make the code clearer, and
anything that would become a breaking change if types were made stricter.
