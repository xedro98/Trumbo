---
name: refactoring
description: Safe, incremental refactoring — extract, rename, simplify, and restructure code without changing behavior.
---

# Refactoring Skill

When refactoring code, work through this disciplined process.

## 1. Establish a safety net

Before you change anything:

- Confirm the existing tests pass. If there are no tests, write
  characterization tests first.
- Identify every caller and consumer of the code you're refactoring.
- Write down the current behavior as your contract — refactoring must not
  change it.

## 2. Plan the refactoring

Pick the smallest transformation that makes progress.

### Common refactorings

- **Extract function** — pull a block into a named function when it has a clear
  purpose.
- **Inline function** — remove a function that adds indirection without
  clarity.
- **Rename** — change names to communicate intent (variables, functions, types,
  files).
- **Extract type/interface** — pull inline types into named declarations.
- **Simplify conditionals** — replace nested if/else with early returns, guard
  clauses, or lookup tables.
- **Remove dead code** — delete unreachable code, unused imports, and
  commented-out blocks.
- **Reduce parameters** — group related parameters into an options object.
- **Split module** — break a large file into focused modules with clear
  responsibilities.

### Decision criteria

- Does this reduce cognitive load for the next reader?
- Does this make the code easier to test?
- Does this reduce the blast radius of future changes?
- If none of the above — don't refactor it.

## 3. Execute incrementally

- One refactoring at a time.
- After each change, verify the tests still pass.
- Commit or checkpoint after each successful step.
- If a step breaks something, revert it and try a smaller step.

## 4. Verify

After all changes:

- Run the full test suite.
- Check that every caller still compiles and works correctly.
- Verify no behavior changed — same inputs, same outputs.
- Review the diff: is the code genuinely simpler, or just different?

## 5. Report

Summarize:

- What was refactored and why.
- Which files changed.
- Any behavior that looks different but is equivalent.
- Anything left incomplete or worth refactoring next.
