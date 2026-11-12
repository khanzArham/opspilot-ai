# OpsPilot AI — Build Log

Keep entries concise. This file is historical evidence; it is **not** startup context.

## Entry template

### YYYY-MM-DD — Day X / Step Y
- **Implemented:** 
- **Files changed:** 
- **Tests/checks:** 
- **Issue discovered:** 
- **Decision/fix:** 
- **Next:** 

---

### 2026-11-12 — Day 1 / Step 1
- **Implemented:** Local git repo (`main` baseline, branch `day-01-foundation`) with public-safe `.gitignore`; Next.js 16.4.6 + React 19.3 + Tailwind 4.3 + TS strict scaffold via npm on Node 26.13.1; minimal landing page and `/dashboard` placeholder; `engines.node` `>=26 <27`; `.nvmrc` 26.
- **Files changed:** `.gitignore`, `.nvmrc`, `package.json`, `package-lock.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `public/*`, `src/app/{layout,page,globals.css}`, `src/app/dashboard/page.tsx`.
- **Tests/checks:** `npm run lint` pass; `npx tsc --noEmit` pass; `npm run dev` starts, `/` and `/dashboard` return 200; `npm audit --omit=dev` 0 vulnerabilities. Secret scan of tree and history: clean.
- **Issue discovered:** Next dev auto-generated `AGENTS.md`.
- **Decision/fix:** Set `agentRules: false` in `next.config.ts`; CLAUDE.md remains the sole agent contract. GitHub repo not yet created (owner will commit/push).
- **Next:** Step 2 — install locked dependencies and shadcn/ui.

---

### 2026-11-12 — Day 1 / Step 2
- **Implemented:** Installed @supabase/supabase-js, @supabase/ssr, zod 4, @google/genai 3, lucide-react, recharts 3; dev: vitest 5.1, @vitejs/plugin-react, jsdom, Testing Library (react/dom/jest-dom/user-event), @playwright/test. shadcn/ui initialized (base-nova, neutral) with only: button, card, table, badge, dialog, tabs, input, textarea, alert, dropdown-menu, skeleton, sonner.
- **Files changed:** `package.json`, `package-lock.json`, `components.json`, `src/lib/utils.ts`, `src/components/ui/*` (12), `src/app/globals.css`.
- **Tests/checks:** `npm run lint` pass; `tsc --noEmit` pass; `npm run build` pass; `npm audit --omit=dev` 0 vulnerabilities (12 dev-only remain: shadcn CLI and typescript-eslint chain, need semver-major fixes; not forced).
- **Issue discovered:** (1) Vitest 5 peer-requires `@types/node` >=22; scaffold pinned ^20 → ERESOLVE. (2) `shadcn init` added the `shadcn` CLI as a runtime dependency (only used for a build-time CSS import), which put 6 audit findings in prod deps. (3) protobufjs postinstall blocked by npm allowScripts (optional script).
- **Decision/fix:** Bumped `@types/node` to 26 to match the locked runtime (no `--force`). Moved `shadcn` to devDependencies. Left protobufjs script blocked. `cn` package is from shadcn's maintainer (current shadcn template), kept.
- **Next:** Step 3 — README and docs skeleton.

---

### 2026-11-12 — Day 1 / Step 3
- **Implemented:** `README.md` (fictional-data notice, honest WIP status, stack, scripts), `docs/security.md` and `docs/test-matrix.md` (all unbuilt controls/tests marked Planned). `CLAUDE.md` already at root and unchanged vs committed baseline; `architecture.md`, `loom-script.md`, `build-log.md` already existed.
- **Files changed:** `README.md`, `docs/security.md`, `docs/test-matrix.md`.
- **Tests/checks:** `npm run lint` pass; `tsc --noEmit` pass; secret-pattern scan of new files clean.
- **Issue discovered:** Spec has `docs/security-testing.md` (source of truth) alongside the required `security.md`/`test-matrix.md`.
- **Decision/fix:** New files are concise public summaries that link to `security-testing.md` rather than duplicating it. README references `.env.example`, which Step 4 creates.
- **Next:** Step 4 — folder structure and `.env.example`.

---

### 2026-11-12 — Day 1 / Step 4 (partial)
- **Implemented:** Folder tree from architecture §6 under `src/components/*`, `src/lib/*`, `tests/{unit,integration,e2e}`, `bruno/OpsPilot`, `supabase/migrations`, `.github/workflows` (`.gitkeep` markers only, no empty index files); `n8n/README.md`. `src/app` routes, `seed.sql`, `playwright.config.ts`, `quality.yml` deliberately deferred to the steps/days that add real code.
- **Files changed:** folders above, `n8n/README.md`.
- **Tests/checks:** `npm run lint` pass; `tsc --noEmit` pass; `.gitkeep` not git-ignored.
- **Issue discovered:** `.env.example` could not be written: `.claude/settings.json` denies `Read(./.env.*)`, which also matches `.env.example`. Also `src/lib/utils.ts` (shadcn) coexists with the spec's `src/lib/utils/` folder; nothing imports `@/lib/utils`.
- **Decision/fix:** Did not bypass the deny rule. `.env.example` pending owner decision (create it manually, or narrow the deny rule). Resolve the `utils.ts` vs `utils/` overlap in Step 5 when the first real utility is added.
- **Next:** Finish `.env.example`, then Step 5.
- **Update:** Owner created `.env.example` and removed an accidental `.env.example` line from `.gitignore`; verified via `git check-ignore` that `.env.example` is trackable and `.env`/`.env.local` are ignored. Step 4 complete.

---

### 2026-11-12 — Day 1 / Step 5
- **Implemented:** Scripts `typecheck`, `test` (`vitest run`), `test:watch`, `test:e2e` added beside `dev`/`build`/`lint`. `vitest.config.ts` (node env, `@` alias, `tests/unit/**`). Smoke test on real utility `normalizeEmail`/`normalizeExternalId` (4 tests; reused later by Deal Won validation). Moved shadcn `src/lib/utils.ts` to `src/lib/utils/cn.ts` and updated `components.json` alias, resolving the file/folder overlap.
- **Files changed:** `package.json`, `vitest.config.ts`, `src/lib/utils/normalize.ts`, `src/lib/utils/cn.ts`, `components.json`, `tests/unit/normalize.test.ts` (removed `tests/unit/.gitkeep`).
- **Tests/checks:** lint pass; typecheck pass; `npm test` 1 file / 4 tests pass; `npm run build` pass. Node 26.13.1.
- **Issue discovered:** Vite warns `vitest.config.ts` uses ESM syntax in a CJS-typed package (future-major notice, non-blocking). `test:e2e` has no Playwright config/tests/browsers yet, so it is not runnable.
- **Decision/fix:** Kept spec filename `vitest.config.ts`; did not switch package to `"type": "module"`. Playwright config and browsers deferred to the day that adds E2E.
- **Next:** Day 1 close-out: verify end-of-day checklist, owner commits and merges.

---

### 2026-11-12 — Day 2 / Step 1 (partial: repo side done, owner side pending)
- **Implemented:** Supabase CLI 3.1.0 added as a pinned devDependency; `supabase init` generated `supabase/config.toml` (`project_id = "opspilot-ai"`) and `supabase/.gitignore`. `config.toml` contains only `env(...)` placeholders, no secret values.
- **Files changed:** `package.json`, `package-lock.json`, `supabase/config.toml`, `supabase/.gitignore`, `docs/STATUS.md`.
- **Tests/checks:** lint pass; typecheck pass; `npm test` 4/4 pass; `npm audit --omit=dev` 0 vulnerabilities.
- **Issue discovered:** Creating the hosted project, `supabase login`/`link`, and `.env.local` need the owner's Supabase account and secrets; `.env.*` is also deny-listed for Claude.
- **Decision/fix:** Claude does not handle the access token, DB password or API keys. Owner performs login, link and `.env.local`.
- **Next:** Owner finishes Step 1; then Day 2 Step 2 (migration 001).
- **Update:** Owner created the hosted Supabase Free project (`opspilot-ai`, Postgres 17), logged in, linked, and configured `.env.local` (never read by Claude). Verified: `projects list` shows linked + `ACTIVE_HEALTHY`; `.env.local` is git-ignored. Step 1 complete.

---

### 2026-11-12 — Day 2 / Step 2
- **Implemented:** `supabase/migrations/001_extensions.sql`: idempotent `create extension if not exists` for `pgcrypto` and `pg_net` (schema `extensions`), `pg_cron` (`pg_catalog`), `supabase_vault` (`vault`). Status fields deliberately left to text + CHECK in 002.
- **Files changed:** `supabase/migrations/001_extensions.sql` (removed `.gitkeep`).
- **Tests/checks:** `supabase db push --remote --dry-run` lists `001_extensions.sql` as the only pending migration (nothing applied); lint/typecheck/tests pass (4/4); no secrets in migration.
- **Issue discovered:** Supabase CLI 3.x defaults `db push` to the local stack (needs `supabase start`); remote requires `--remote`.
- **Decision/fix:** Use `--remote` for hosted operations. Migration is not applied yet: the plan applies all migrations in Step 6 after 002–003 exist.
- **Next:** Step 3 — migration 002 core schema.

---

### 2026-11-12 — Day 2 / Steps 3–6 (day complete, pending owner commit/merge)
- **Implemented:** `002_core_schema.sql` — 11 tables per database.md §9 (+ `profiles` from architecture §8.4), UUID PKs, `timestamptz`, text + named CHECKs for every status/enum, FKs without cascade (except `profiles→auth.users`), `set_updated_at()` trigger on profiles/clients/support_tickets/jobs, **RLS enabled with no policies (fail closed)** on all tables. `003_indexes_constraints.sql` — 6 named unique constraints (event_id, external_client_id, normalized_email, (client_id,task_key), (job_id,attempt_number), diagnosis_id) + queue/FK/operational indexes incl. `(status,next_retry_at)`. `seed.sql` — 2 fictional `.example` clients + 8 tasks, idempotent; profiles derived from two Auth users the owner creates (no passwords). All 3 migrations applied to hosted project via `supabase db push --remote`; seed applied via `db query`.
- **Files changed:** `supabase/migrations/00{1,2,3}_*.sql`, `supabase/seed.sql`, `supabase/verification/invariants.sql`, `supabase/config.toml`, docs.
- **Tests/checks:** Remote schema inspected: 4 extensions (`pg_cron`, `pg_net`, `pgcrypto`, `supabase_vault`), 11 tables all RLS-on, 6 unique constraints. Invariants run directly in SQL (rolled back, no residue): duplicate event_id, external_client_id, normalized_email, task key, attempt number, second decision → `unique_violation`; disallowed AI action + bad job status → `check_violation`; orphan task → `foreign_key_violation` (9/9 rejected). `supabase db advisors`: no issues. lint/typecheck pass; tests 4/4; secret scan clean.
- **Issue discovered:** (1) Plan didn't mention RLS this day, but un-RLS'd tables on the hosted project would be reachable via the public API, so RLS is enabled deny-all now; read policies come later per database.md §11. (2) Added 0–1 CHECKs on `ai_confidence`/`confidence` (not in spec) so untrusted AI values can't be stored out of range. (3) `profiles` seed rows are empty until the two Auth users exist.
- **Decision/fix:** Kept spec column names exactly; `profiles` has no unique beyond PK. The hosted project is the only environment (CLI labels it "production"); no local stack/Docker used.
- **Next:** Owner: create the two Auth users (`admin@growthflow.example`, `operator@growthflow.example`), re-run `supabase/seed.sql`, commit, merge `day-02-database` → `main`. Then Day 3.

---
