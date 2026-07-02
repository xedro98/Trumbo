---
id: dead-code-finder
title: Find and Report Dead Code
workspaceRoot: /absolute/path/to/repo
schedule: "0 4 * * SUN"
tools: run_commands,read_files,search_codebase
mode: plan
enabled: false
modelSelection:
  providerId: trembo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 2400
maxIterations: 30
tags:
  - automation
  - quality
  - refactoring
metadata:
  owner: development
  reportType: analysis
---
Hunt for code that nothing reaches and exports that nothing imports. Stay in
`plan` mode — propose removals, do not delete.

1. Unused exports:
   - Functions never called inside the module or imported elsewhere.
   - Classes with no instantiations.
   - Constants and variables nobody references.
   - Type definitions with no users.

2. Unreachable code:
   - Statements after `return`/`throw`.
   - Branches that can never be taken.
   - Dead `try`/`catch` blocks and unused catch bindings.

3. File-level waste:
   - Modules that are never imported.
   - Test files with no matching implementation.
   - Demo or example code living in the main source tree.
   - Code marked for removal that's still around.

For each finding, report the file and line range, a confidence level
(high/medium/low), and whether it is safe to remove or needs a human eye.

Safe-to-remove candidates:

- Variables only ever assigned, never read.
- Functions declared but never called.
- Exports with no external references.

Needs review:

- Anything that might be called dynamically (reflection, string-based
  dispatch, test fixtures).
- Public API surface — check for external consumers before removing.
- Backwards-compatibility shims still within their deprecation window.

Close with an estimate of how much code would disappear if the safe-to-remove
set were deleted.
