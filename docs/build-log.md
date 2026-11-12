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
