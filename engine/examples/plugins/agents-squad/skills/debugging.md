---
name: debugging
description: Systematic debugging — reproduce, isolate, diagnose, and fix bugs with root-cause analysis.
---

# Debugging Skill

When debugging an issue, work through this systematic process.

## 1. Understand the bug

- Read the error message, stack trace, and logs carefully.
- Reproduce the issue. If you can't reproduce it, you can't verify a fix.
- Pin down the expected behavior versus the actual behavior.
- Note the environment: OS, runtime version, configuration, input data.

## 2. Isolate

Narrow the scope with binary search:

- **Which file?** Follow the stack trace or data flow to the origin.
- **Which function?** Add logging or breakpoints at the entry and exit of
  suspect functions.
- **Which line?** Inspect variable values before and after the suspect
  operation.
- **Which input?** Find the minimal input that triggers the bug.

Common isolation techniques:

- Comment out code blocks to find the trigger.
- Add temporary `console.log` / `console.error` with labeled values.
- Step through with a debugger.
- Write a minimal reproduction test case.

## 3. Diagnose

Once isolated, find the root cause.

Common root causes:

- **Type mismatch** — the runtime value doesn't match the expected type (null,
  undefined, wrong shape).
- **State mutation** — shared state modified unexpectedly by another code path.
- **Race condition** — timing-dependent behavior in async or concurrent code.
- **Off-by-one** — loop bounds, array indexing, or string slicing errors.
- **Missing error handling** — an unhandled rejection, uncaught exception, or
  swallowed error.
- **Stale reference** — a closure captures a variable that changes, or cached
  data that's out of date.
- **Environment difference** — works locally but fails in CI or production due
  to config, permissions, or versions.

Ask "why did this happen?" at least twice to get past the symptom to the root
cause.

## 4. Fix

- Write a test that fails because of the bug, before you fix it.
- Make the minimal change that addresses the root cause.
- Confirm the test now passes.
- Check for the same pattern elsewhere in the codebase.
- Run the full suite to confirm no regressions.

## 5. Report

Document:

- What the bug was — symptoms and root cause.
- How it was reproduced.
- What the fix was and why it's correct.
- Whether the same pattern exists elsewhere.
- What test was added to prevent regression.
