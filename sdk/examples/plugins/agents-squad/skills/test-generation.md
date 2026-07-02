---
name: test-generation
description: Generate comprehensive test suites — unit, integration, and edge-case coverage with proper mocking strategies.
---

# Test Generation Skill

When generating tests, work through this process.

## 1. Analyze the target

- Read the source code thoroughly before writing any tests.
- Identify the public API surface: exports, parameters, return types.
- Map the dependencies that need mocking or stubbing.
- List the behavioral contracts — what must always be true?

## 2. Plan test cases

Organize tests into categories.

### Happy path

- Standard inputs produce expected outputs.
- Every documented use case works correctly.

### Edge cases

- Empty inputs (null, undefined, empty string, empty array, 0).
- Boundary values (min/max integers, very long strings, single-element arrays).
- Unicode and special characters in string inputs.

### Error cases

- Invalid input types and shapes.
- Missing required fields.
- Network and IO failures (timeouts, connection refused, permission denied).
- Concurrent access and race conditions where applicable.

### Integration points

- Verify correct interaction with dependencies.
- Check that mocks match the real interface.
- Test retry and fallback behavior.

## 3. Write the tests

Follow these conventions:

```
describe("ModuleName", () => {
  describe("functionName", () => {
    it("should [expected behavior] when [condition]", () => {
      // Arrange — set up inputs and mocks
      // Act — call the function
      // Assert — verify the result
    });
  });
});
```

### Mocking strategy

- Mock at the boundary (network, filesystem, database), not at internal
  functions.
- Use dependency injection where possible instead of module mocking.
- Verify mock call counts and arguments, not just return values.
- Reset mocks between tests to prevent state leakage.

### Assertions

- Assert on specific values, not just truthiness.
- Check error messages and types, not just that an error was thrown.
- Use snapshot tests sparingly — only for stable, complex output.
- Verify side effects (files written, events emitted, logs produced).

## 4. Quality checks

Before finalizing:

- Run the tests and confirm they pass.
- Verify each test fails when the behavior it tests is broken.
- Check that tests are independent and can run in any order.
- Ensure test names describe the behavior, not the implementation.
- Remove redundant tests that don't add coverage.
