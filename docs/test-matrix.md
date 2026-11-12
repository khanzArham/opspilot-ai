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
| RLS denies unauthorized mutation | Passing via `supabase/verification/rls.sql` (34 SQL checks as anon / operator / admin, rolled back). Automated Vitest integration version is still Planned (Day 3 Step 5 / Day 13). |

### Auth / authorization coverage (Day 3)

| Layer | Where | What it proves | Status |
|---|---|---|---|
| Unit (mocked boundaries) | `tests/unit/{auth-roles,admin-check-route,proxy,auth-validation,supabase-clients,errors}.test.ts` | 401 unauthenticated, 403 operator on admin-only (incl. crafted headers/query/body), 200 admin, 403 hidden/missing profile, safe 500, session-scoped client used and admin client never called, proxy redirects, `next` open-redirect guard | Passing (`npm test`) |
| Database role simulation | `supabase/verification/rls.sql` | 34 checks as anon / operator / admin / no-profile user; privileges and RLS independently enforced | Passing |
| Integration (real sessions, hosted dev DB) | `tests/integration/auth.test.ts`, `npm run test:integration` | Real `requireUser`/`requireRole`/route handler with real JWTs: forged cookie 401, operator 403, admin 200, self-read RLS, browser mutations denied (42501), admin client spy never called | **Written; NOT yet executed** (suite skips: `SUPABASE_SECRET_KEY` not available to the test process). Must pass before Day 3 is merged. |
| Runtime HTTP (production build) | manual `curl` | Crafted `POST /api/admin/check` without a session returns 401 envelope | Passing |

Integration tests build sessions without any stored password: an admin-generated magic-link token is exchanged for a session. They need `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SECRET_KEY` in the local, git-ignored `.env.local`. They are intentionally separate from `npm test` so the default suite needs no network or secrets.

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
