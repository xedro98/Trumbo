---
name: migration
description: Plan and execute data or schema migrations — database, config, and API migrations with rollback strategies.
---

# Migration Skill

When planning or executing a migration (database schema, data transformation,
config format, or API version), work through this process.

## 1. Assess scope

- What is being migrated? Schema, data, config, or API contract.
- How much data is affected? Row count, file count, consumer count.
- What's the downtime tolerance? Zero-downtime, a maintenance window, or
  offline.
- What systems depend on the current state?

## 2. Plan the migration

### Strategy selection

- **Expand-Contract** (preferred for zero-downtime):
  1. Expand — add new columns, fields, or endpoints alongside the old ones.
  2. Migrate — backfill data, update consumers to the new format.
  3. Contract — remove the old columns, fields, or endpoints.

- **Blue-Green** — run old and new versions in parallel, then switch traffic.
- **Big Bang** — take the system offline, migrate, bring it back. Only for small
  datasets or when downtime is acceptable.

### Rollback plan

Every migration needs a rollback plan before execution:

- Can the migration be reversed with a down migration?
- Is there a backup of the current state?
- What is the point of no return, if any?
- How long does rollback take?

## 3. Write the migration

### Database migrations

- One migration file per logical change.
- Include both `up` and `down` functions.
- Use transactions where the database supports them.
- Never modify data and schema in the same migration.
- Test with production-scale data volumes, not just empty tables.

### Data migrations

- Process in batches to avoid memory exhaustion and lock contention.
- Log progress (processed X of Y records).
- Make migrations idempotent so they can be re-run after a partial failure.
- Validate data after migration (row counts, checksums, spot checks).

### Config migrations

- Read the old format, write the new format, validate the round-trip.
- Preserve comments and ordering where possible.
- Provide a CLI command or script users can run themselves.

## 4. Test

- Run the migration on a copy of production data.
- Verify the application works correctly after migration.
- Run the rollback and verify the application works on the old state.
- Test under load if zero-downtime is required.

## 5. Execute

- Take a backup before starting.
- Run the migration with monitoring on (error rates, latency, disk usage).
- Verify success criteria immediately after completion.
- Keep the rollback plan ready through the agreed monitoring period.

## 6. Report

Document:

- What was migrated and why.
- Duration and any issues encountered.
- Verification results.
- Rollback status — available, expired, or not needed.
