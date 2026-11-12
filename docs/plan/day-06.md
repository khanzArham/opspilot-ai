# OpsPilot AI — Day 06 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/database.md`
- `docs/workflows.md`
- `docs/api-contracts.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 6 — Worker Endpoint, Demo Failure Jobs and Supabase Cron

### 1. Implement worker service

Create a worker ID per invocation, call `claim_due_jobs`, process up to 10 jobs, isolate each job failure so one bad job does not abort the batch, and return compact aggregate counts.

**Primary files/artifacts:**
- `src/lib/domain/jobs/process-due.ts`

### 2. Implement internal worker route

Create `POST /api/internal/jobs/process`. It must have Node runtime, no user auth, and must authenticate only the HMAC-signed cron request.

**Primary files/artifacts:**
- `src/app/api/internal/jobs/process/route.ts`

### 3. Implement HMAC verification

Verify timestamp freshness <= 300 seconds, compute HMAC-SHA256 over `<timestamp>.opspilot-process-due-jobs`, and use `timingSafeEqual`. Reject malformed signatures before reading business state.

**Primary files/artifacts:**
- `src/lib/crypto/verify-cron-signature.ts`

### 4. Implement demo transient and permanent handlers

Transient handler fails until its threshold and then succeeds. Permanent handler always throws `INVALID_UPSTREAM_DATA` and must dead-letter without wasted retries.

**Primary files/artifacts:**
- `src/lib/domain/jobs/handlers/demo-transient.ts`
- `src/lib/domain/jobs/handlers/demo-permanent.ts`

### 5. Configure Supabase Vault and Cron

Create a migration/function that reads the base URL/signing secret from Vault, signs the cron request, and uses `pg_net` to POST to the worker every minute. Do not put the secret value in the migration.

**Primary files/artifacts:**
- `supabase/migrations/006_cron.sql`

### 6. Verify queue behavior

Run temporary failure through at least two processing cycles and confirm attempt history. Run permanent failure and confirm immediate dead-letter.

**Primary files/artifacts:**
- `tests/integration/jobs*`
- `docs/build-log.md`

### End-of-day acceptance

- [ ] Cron worker rejects unsigned calls.
- [ ] Signed worker call succeeds.
- [ ] Transient failure schedules retry and later succeeds.
- [ ] Permanent failure reaches dead-letter.
- [ ] One bad job cannot fail the entire batch.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
