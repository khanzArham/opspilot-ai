# OpsPilot AI — Day 04 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/api-contracts.md`
- `docs/database.md`
- `docs/workflows.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 4 — Deal-Won Event Contract, Idempotency and Business Deduplication

### 1. Define the Zod Deal Won contract

Implement the exact event fields from Section 12. Normalize strings and validate schema version `1` and event type `deal.won`. Reject invalid input before database writes.

**Primary files/artifacts:**
- `src/lib/validation/deal-won.ts`

### 2. Implement canonical payload hashing

Create a deterministic canonical JSON serialization for the validated payload and calculate SHA-256. The same semantic validated payload must produce the same hash.

**Primary files/artifacts:**
- `src/lib/utils/canonical-json.ts`
- `src/lib/crypto/hash.ts`

### 3. Implement processed-event reservation

Attempt to insert the `processing` event record. On unique conflict, load the existing event. Same hash means replay. Different hash means HTTP 409. Do not re-run side effects for a replay.

**Primary files/artifacts:**
- `src/lib/domain/onboarding/*`

### 4. Implement canonical client insertion

Use the database unique constraints as the final race guard. Resolve external client ID and normalized email against existing rows. Reuse one canonical matching client; if the two identifiers point to different existing clients, return `CLIENT_IDENTITY_CONFLICT` and never auto-merge. Do not use a check-then-insert-only pattern.

**Primary files/artifacts:**
- `src/lib/domain/onboarding/*`

### 5. Create starter tasks idempotently

Insert the four locked task keys. Use unique `(client_id,task_key)` behavior to make repeated processing safe.

**Primary files/artifacts:**
- `src/lib/domain/onboarding/*`

### 6. Add workflow/audit records and API route

Create workflow run at start, finalize it on completion/failure, persist stable result JSON on `processed_events`, and add meaningful audit entries. Expose through `POST /api/events/deal-won`.

**Primary files/artifacts:**
- `src/app/api/events/deal-won/route.ts`
- `src/lib/audit/*`

### End-of-day acceptance

- [ ] First event creates one client and four tasks.
- [ ] Exact replay creates zero additional business rows.
- [ ] New event ID for same client creates no new client/tasks.
- [ ] Conflicting external ID/email identity returns 409 and never auto-merges clients.
- [ ] Changed payload reused with same event ID returns 409.
- [ ] Validation failure produces no business writes.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
