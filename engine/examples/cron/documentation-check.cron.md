---
id: documentation-check
title: Documentation Coverage Audit
workspaceRoot: /absolute/path/to/repo
schedule: "0 5 * * THU"
tools: run_commands,read_files,search_codebase
mode: plan
enabled: false
modelSelection:
  providerId: trumbo
  modelId: anthropic/claude-opus-4.7
timeoutSeconds: 1800
maxIterations: 25
tags:
  - automation
  - documentation
  - quality
metadata:
  owner: documentation
  checkAreas:
    - publicAPIs
    - complexFunctions
    - typeDefinitions
    - modules
---
Audit how well the codebase is documented. Stay in `plan` mode — recommend
changes, do not edit files.

1. Public API surface:
   - Functions exported from public modules.
   - Classes and interfaces.
   - Type definitions, including generics.
   - Decorators and annotations.

2. Missing docs:
   - Public functions with no JSDoc.
   - Complex functions with no explanation of what they do or why.
   - Public types with no description.
   - Modules with no README or header comment.

3. Quality of existing docs:
   - JSDoc missing `@param`/`@return` where it should have them.
   - Comments that are stale or contradict the code.
   - Code samples in docs that no longer compile or run.
   - Links pointing at code that has been moved or deleted.

4. Documentation structure:
   - Main README quality and completeness.
   - Architecture documentation.
   - Contributing guide.
   - API reference.
   - Changelog maintenance.

Report:

- Documentation coverage percentage per module.
- Top 10 undocumented public APIs.
- Types missing descriptions.
- Files with complex logic that need a written explanation.
- Stale or broken doc instances.

Recommendations, in priority order: high-priority gaps (public APIs with no
docs), style improvements, JSDoc templates to adopt, and links that need
updating.
