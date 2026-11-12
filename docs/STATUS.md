# OpsPilot AI — Current Build Status

> Keep this file short. Claude reads it at the beginning of every session.

**Current Day:** Day 3  
**Current Step:** Step 5 — Add auth tests (code complete; integration run BLOCKED)  
**State:** Steps 1–4 DONE. Step 5: unit tests pass; integration suite written but skipped because `SUPABASE_SECRET_KEY` is not available to the test process. Day 3 NOT yet ready to merge.  
**Current branch:** `day-03-auth-rls`  
**Last updated:** 2026-11-12

## Read for this session

1. `CLAUDE.md`
2. `docs/plan/day-03.md`
3. Files listed under `Context to load` in `docs/plan/day-03.md` (`docs/architecture.md`, `docs/database.md`, `docs/security-testing.md`)

## Completed

- [x] Day 1
- [x] Day 2
- [ ] Day 3
- [ ] Day 4
- [ ] Day 5
- [ ] Day 6
- [ ] Day 7
- [ ] Day 8
- [ ] Day 9
- [ ] Day 10
- [ ] Day 11
- [ ] Day 12
- [ ] Day 13
- [ ] Day 14

## Current task

Owner: make `SUPABASE_SECRET_KEY` available to the integration run (non-empty value in the git-ignored `.env.local`; it is the only one of the three required variables not resolving), then run `npm run test:integration` and confirm 13/13 pass. Add `--reporter=verbose` to see skip reasons. After it passes: commit, merge `day-03-auth-rls` → `main`, and start Day 4. The temporary `POST /api/admin/check` endpoint must be removed when the real admin diagnose endpoint exists.

## Last verified quality checks (Day 3 Step 5)

- `npm run lint`: PASS, 0 warnings (Node 26.13.1)
- `npm run typecheck`: PASS (`next typegen && tsc --noEmit`)
- `npm test`: PASS (7 files, 62 tests)
- `npm run test:integration`: NOT EXECUTED (13 skipped; `SUPABASE_SECRET_KEY` unavailable)
- `npm run build`: PASS
- Runtime: crafted unauthenticated `POST /api/admin/check` → 401 envelope
- RLS verification (`supabase/verification/rls.sql`): 34/34 PASS as anon / operator / admin / no-profile user, rolled back
- `supabase db advisors --remote`: 1 WARN (leaked-password protection, Pro-only; accepted)
- `npx playwright test`: NOT RUN (no config/tests/browsers yet)

## Blockers / known issues

- `.claude/settings.json` deny `Read(./.env.*)` also matches `.env.example` and `.env.local`; Claude cannot read or write them (owner maintains them).
- Public sign-ups and anonymous sign-ins are disabled (owner-confirmed). Advisor WARN `auth_leaked_password_protection` is Pro-only and accepted ($0 rule).
- Approved design: `failure_diagnoses`/`approval_decisions` are not browser-readable; the admin Failures page reads them server-side after `requireRole("admin")`.
- Real sign-in/sign-out not yet exercised end to end: needs the two Auth users + `supabase/seed.sql` re-run; owner can try in a browser (`npm run dev`, `/dashboard` → login).
- `next.config.ts` has `cacheComponents` enabled: request-time APIs (`cookies()`) need Suspense boundaries in pages (matters for Step 2).
- Vite notice: `vitest.config.ts` ESM-in-CJS warning (non-blocking).
- 12 dev-only `npm audit` findings (shadcn CLI, typescript-eslint chain) need semver-major fixes.
- Playwright config/browsers not set up yet (needed for E2E days).

## STATUS update rule

After each step, replace the current task with the next incomplete step and record only the latest verification state. Put historical notes in `docs/build-log.md`.
