# OpsPilot AI — Day 09 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/workflows.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 9 — AI Failure Diagnosis Agent and Sanitized Context

### 1. Implement failure-context sanitizer

Create an allow-list-based sanitizer. The safest design is to construct a new context object from approved fields rather than recursively forwarding arbitrary job payload keys.

**Primary files/artifacts:**
- `src/lib/domain/diagnosis/sanitize.ts`

### 2. Implement diagnosis prompt contract

Write a fixed system instruction enforcing allowed root causes, allowed actions, no executable commands, and NO_ACTION for uncertainty.

**Primary files/artifacts:**
- `src/lib/domain/diagnosis/prompt.ts`

### 3. Implement diagnosis service

Admin-only service verifies job is dead-letter, loads safe attempts/context, calls AI, validates schema, persists `failure_diagnoses`, and writes an audit event.

**Primary files/artifacts:**
- `src/lib/domain/diagnosis/diagnosis-service.ts`

### 4. Implement safe fallback diagnosis

When Gemini fails, persist UNKNOWN + NO_ACTION + confidence 0. The endpoint still returns a valid pending proposal rather than arbitrary text.

**Primary files/artifacts:**
- `src/lib/domain/diagnosis/diagnosis-service.ts`

### 5. Create diagnosis endpoint

Create `POST /api/jobs/[id]/diagnose`. Use `requireRole('admin')`. Operator must receive 403.

**Primary files/artifacts:**
- `src/app/api/jobs/[id]/diagnose/route.ts`

### 6. Build failure diagnosis UI

Show dead-letter error, attempts, root cause, reasoning summary, recommended action, confidence, expected impact and rollback plan.

**Primary files/artifacts:**
- `src/app/dashboard/failures/page.tsx`
- `src/components/failures/*`

### End-of-day acceptance

- [ ] Operator cannot diagnose.
- [ ] Non-dead-letter job cannot be diagnosed.
- [ ] Prompt receives sanitized context only.
- [ ] Only allow-listed actions can persist.
- [ ] Provider failure produces NO_ACTION fallback.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
