# OpsPilot AI — Test Matrix

Coverage plan and live status. Source of truth for required tests: [`security-testing.md`](security-testing.md) section 27. Status values: **Planned**, **Passing**, **Failing**. Update this table as tests land.

Quality command per step: `npm run lint && npm run typecheck && npm test`. Run `npx playwright test` when the reviewer flow changes.

## Unit (Vitest)

| Area | Cases | Status |
|---|---|---|
| Validation | valid Deal Won, missing event ID, unsupported schema version, invalid email, valid ticket, oversized ticket | Planned |
| Normalization | email lowercase/trim, external ID trim, stable canonical payload hash | Planned |
| Ticket rules | billing, access, technical categories; urgent, high, default-low priority | Planned |
| Retry policy | attempt 1 → 1m, 2 → 5m, 3 → 15m, 4 → dead-letter | Planned |
| Failure classifier | 429/503/timeout retryable; invalid payload/unsupported job permanent | Planned |
| AI | valid structured output, invalid-output fallback, allow-list validation, sanitizer strips sensitive keys | Planned |
| Remediation | safe-retry mapping, no-action mapping, invalid action impossible by schema | Planned |

## Integration (hosted Supabase dev project, synthetic prefixes, cleanup)

| Case | Status |
|---|---|
| Event ID unique | Planned |
| Business duplicate unique | Planned |
| Onboarding task unique | Planned |
| Atomic claim never double-claims | Planned |
| Expired lease can be reclaimed | Planned |
| Job attempt history persists | Planned |
| Approval decision uniqueness | Planned |
| RLS denies unauthorized mutation | Planned |

## API (Bruno)

Deal Won, replay, same client new event, ticket, diagnose, decision, report, n8n machine endpoint, invalid auth, invalid payload. Status: Planned.

## E2E (Playwright)

| ID | Flow | Status |
|---|---|---|
| E2E-01 | Logged-out redirect; admin and operator sign in | Planned |
| E2E-02 | Send New Deal → row and tasks appear | Planned |
| E2E-03 | Replay Same Event → counts unchanged | Planned |
| E2E-04 | Same Client New Event → client count unchanged | Planned |
| E2E-05 | Permanent failure → dead-letter | Planned |
| E2E-06 | Admin diagnoses → proposal → approve → deterministic result | Planned |
| E2E-07 | Operator cannot diagnose or approve | Planned |

## Last verified

Updated from `docs/STATUS.md` at the end of each step. No automated tests exist yet; the Vitest smoke test arrives in Day 1 Step 5.
