# OpsPilot AI — Day 10 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/workflows.md`
- `docs/api-contracts.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 10 — Human Approval, Deterministic Remediation and Audit Trail

### 1. Implement decision schema and service

Accept only approved/rejected plus optional comment. Enforce one decision per diagnosis. Admin only.

**Primary files/artifacts:**
- `src/lib/validation/diagnosis.ts`
- `src/lib/domain/diagnosis/decision-service.ts`

### 2. Implement deterministic remediation mapping

Create explicit switch/mapping for the five allowed actions from Section 19. The mapping contains backend code only; it never executes model-provided instructions.

**Primary files/artifacts:**
- `src/lib/domain/remediation/executor.ts`

### 3. Implement state revalidation

Immediately before execution, reload diagnosis, approval, and target job. Abort with 409 if the target state changed or the proposal is already decided.

**Primary files/artifacts:**
- `src/lib/domain/remediation/executor.ts`

### 4. Implement decision endpoint

Create `POST /api/diagnoses/[id]/decision`. Persist decision first within safe transaction boundaries, execute deterministic action, then record audit outcome.

**Primary files/artifacts:**
- `src/app/api/diagnoses/[id]/decision/route.ts`

### 5. Add approval UI

Admin sees Approve and Reject controls with confirmation dialog. Operator sees read-only diagnosis details.

**Primary files/artifacts:**
- `src/components/failures/*`

### 6. Add security/state tests

Test operator 403, duplicate decision 409, safe retry requeue, NO_ACTION no mutation, stale target state 409.

**Primary files/artifacts:**
- `tests/unit/remediation*`
- `tests/integration/diagnosis*`

### End-of-day acceptance

- [ ] No AI output directly mutates a job.
- [ ] Only admin can decide.
- [ ] Decision is immutable.
- [ ] Safe retry follows exact deterministic behavior.
- [ ] Every decision/execution is audited.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
