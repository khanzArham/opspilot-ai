# OpsPilot AI — Day 05 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/database.md`
- `docs/workflows.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 5 — Durable Queue, Atomic Claims, Attempts and Telegram Notification

### 1. Implement `enqueueJob()`

Create a typed job enqueue service. Store only minimal entity IDs and template keys. Default max attempts to four and due time to now.

**Primary files/artifacts:**
- `src/lib/domain/jobs/enqueue.ts`

### 2. Create atomic claim RPC

Add SQL function `claim_due_jobs()` using `FOR UPDATE SKIP LOCKED`, batch size input, lease owner and expiry. Use a 120-second lease. Include expired processing leases as reclaimable.

**Primary files/artifacts:**
- `supabase/migrations/005_job_claim_rpc.sql`

### 3. Implement job handler registry

Create explicit typed dispatch for the four locked job types. Unknown job type must throw a permanent invariant error.

**Primary files/artifacts:**
- `src/lib/domain/jobs/handlers/*`
- `src/lib/domain/jobs/registry.ts`

### 4. Implement retry policy and failure classifier

Create typed retryability classification and fixed delays: 1m, 5m, 15m, then dead-letter. Do not use unbounded loops.

**Primary files/artifacts:**
- `src/lib/domain/jobs/retry-policy.ts`
- `src/lib/errors/*`

### 5. Implement Telegram provider

Create a small notification interface and a Telegram implementation. Use server-side `fetch` to the Bot API, apply a timeout, sanitize errors, and map 429/5xx/network errors to retryable failures.

**Primary files/artifacts:**
- `src/lib/providers/notifications/notification-provider.ts`
- `src/lib/providers/notifications/telegram-provider.ts`

### 6. Integrate onboarding notification job

The first successful client onboarding enqueues exactly one `SEND_ONBOARDING_NOTIFICATION` job. Replays and business duplicate events must not create additional onboarding notification jobs.

**Primary files/artifacts:**
- `src/lib/domain/onboarding/*`

### End-of-day acceptance

- [ ] Two concurrent claim requests do not claim the same job.
- [ ] Expired leases can be reclaimed.
- [ ] Attempts are persisted.
- [ ] Retry times match the fixed policy.
- [ ] Onboarding generates one notification job only.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
