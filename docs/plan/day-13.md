# OpsPilot AI — Day 13 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/security-testing.md`
- `docs/workflows.md`
- `docs/database.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 13 — Full Test Matrix, Security Review and Failure Injection

### 1. Finish unit test matrix

Fill all unit cases from Section 27.1. Remove skipped tests. Ensure tests do not call live Gemini or Telegram.

**Primary files/artifacts:**
- `tests/unit/*`

### 2. Finish database/integration checks

Verify dedupe, atomic claim, lease recovery, decision uniqueness, RLS denial and report fixtures against the synthetic development project.

**Primary files/artifacts:**
- `tests/integration/*`

### 3. Build Playwright reviewer-flow suite

Implement the seven required E2E flows. Use seeded demo accounts through secure local test environment variables. Do not commit passwords.

**Primary files/artifacts:**
- `tests/e2e/*`
- `playwright.config.ts`

### 4. Run failure injection

Exercise AI provider failure, Telegram failure, transient job failure, permanent job failure, stale lease and invalid diagnosis target. Confirm graceful state transitions.

**Primary files/artifacts:**
- `docs/test-matrix.md`

### 5. Perform security review

Search repository for secret patterns and `NEXT_PUBLIC` misuse. Verify server-only imports. Review RLS. Verify machine auth. Check logs and UI for token leakage.

**Primary files/artifacts:**
- `docs/security.md`

### 6. Run production smoke test

On deployed app: login, new deal, replay, duplicate business event, ticket, failure, diagnosis, approval, report. Record any issue and fix before Day 14.

**Primary files/artifacts:**
- `docs/build-log.md`

### End-of-day acceptance

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npx playwright test` passes for the critical suite.
- [ ] No known secret exposure.
- [ ] All acceptance scenarios are reproducible.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
