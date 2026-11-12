# OpsPilot AI — Day 07 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/workflows.md`
- `docs/api-contracts.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 7 — Support Ticket Intake, Deterministic Triage and Review UI

### 1. Define ticket schema

Validate subject/body lengths, optional client ID, and optional external ticket ID. Reject malformed input before writes.

**Primary files/artifacts:**
- `src/lib/validation/ticket.ts`

### 2. Implement deterministic category/priority rules

Implement the exact ordered keyword rules in Section 14 as pure functions. Return `rule_reason` that explains the match.

**Primary files/artifacts:**
- `src/lib/domain/tickets/rules.ts`

### 3. Implement ticket service without AI dependency

Persist a valid ticket with deterministic classification first. The service must be valuable even if no AI key exists.

**Primary files/artifacts:**
- `src/lib/domain/tickets/ticket-service.ts`

### 4. Implement ticket API

Create `POST /api/tickets`. Authenticate admin/operator. Return ticket baseline and correlation ID.

**Primary files/artifacts:**
- `src/app/api/tickets/route.ts`

### 5. Build tickets dashboard

Create table/detail presentation for subject, category, priority, AI state, review state, summary and suggested reply. No reply-send action exists in the MVP.

**Primary files/artifacts:**
- `src/app/dashboard/tickets/page.tsx`
- `src/components/tickets/*`

### 6. Add rule tests

Cover every category branch and every priority branch with Vitest.

**Primary files/artifacts:**
- `tests/unit/ticket-rules.test.ts`

### End-of-day acceptance

- [ ] Ticket creation works with no Gemini key.
- [ ] Rules are deterministic and tested.
- [ ] Every ticket remains review-required.
- [ ] No auto-send functionality exists.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
