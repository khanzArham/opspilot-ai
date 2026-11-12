# OpsPilot AI — Day 02 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/database.md`
- `docs/architecture.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 2 — Supabase Project, Migrations, Core Schema and Database Invariants

### 1. Create one Supabase Free project

Create the hosted Supabase project for OpsPilot. Add only publishable Supabase config to `NEXT_PUBLIC_*`; add the Supabase secret key only to server environment variables.

Install/configure Supabase CLI and link the local repository to the hosted project.

**Primary files/artifacts:**
- `supabase/config.toml`
- `.env.local`

### 2. Write migration 001 for extensions and enums/check constraints

Enable required extensions: `pgcrypto`, `pg_cron`, `pg_net`, and Vault support available in the hosted project. Keep schema creation source-controlled.

Use text + CHECK constraints for the project status fields so migrations remain easy to inspect and change.

**Primary files/artifacts:**
- `supabase/migrations/001_extensions.sql`

### 3. Write migration 002 for all core tables

Create `profiles`, `clients`, `processed_events`, `workflow_runs`, `onboarding_tasks`, `support_tickets`, `jobs`, `job_attempts`, `failure_diagnoses`, `approval_decisions`, and `audit_events` exactly according to Section 9.

Add foreign keys, timestamps, status checks and default values.

**Primary files/artifacts:**
- `supabase/migrations/002_core_schema.sql`

### 4. Write migration 003 for unique constraints and indexes

Add database-level uniqueness for event IDs, external client IDs, normalized email, onboarding task keys, job attempt numbers and one decision per diagnosis.

Add queue indexes for `(status,next_retry_at)` and operational query indexes.

**Primary files/artifacts:**
- `supabase/migrations/003_indexes_constraints.sql`

### 5. Add deterministic seed data

Create only fictional demo records and `.example` emails. Prepare profile seed rows that can be applied after creating one admin and one operator Supabase Auth account.

Do not include passwords in `seed.sql`.

**Primary files/artifacts:**
- `supabase/seed.sql`

### 6. Verify invariants manually

Run migrations. Attempt duplicate event ID, duplicate external client ID, duplicate normalized email and duplicate task key. Each duplicate must be rejected by PostgreSQL even if application code is bypassed.

**Primary files/artifacts:**
- `docs/build-log.md`

### End-of-day acceptance

- [ ] All migrations apply successfully.
- [ ] Schema can be inspected from Git without relying on undocumented dashboard clicks.
- [ ] Duplicate invariants are enforced by PostgreSQL.
- [ ] No real person/customer data exists.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
