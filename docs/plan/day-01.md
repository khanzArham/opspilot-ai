# OpsPilot AI — Day 01 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/architecture.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 1 — Repository Foundation, Claude Contract, UI Skeleton and Quality Gates

### 1. Create the repository and app

Create a new GitHub repository named `opspilot-ai`. Initialize a Next.js 16 App Router project with TypeScript, ESLint and Tailwind CSS 4 using npm. Set Node 26 in the local environment and add an `engines.node` entry compatible with Node 26. Confirm `npm run dev` and `npm run lint` work before adding features.

Create a minimal landing page and `/dashboard` placeholder. Do not build business UI yet.

**Primary files/artifacts:**
- `package.json`
- `src/app/page.tsx`
- `src/app/dashboard/page.tsx`
- `.gitignore`

### 2. Install the locked project dependencies

Install Supabase JS/SSR, Zod, Google GenAI SDK, shadcn/ui prerequisites, Lucide React, Recharts, Vitest, Testing Library where needed, and Playwright. Do not add an ORM or alternate backend framework.

Initialize shadcn/ui and add only the components required by the dashboard: Button, Card, Table, Badge, Dialog, Tabs, Input, Textarea, Alert, Dropdown Menu, Skeleton and Toast/Sonner.

**Primary files/artifacts:**
- `package.json`
- `components.json`

### 3. Create this CLAUDE.md and project documentation skeleton

Place this exact file at repository root as `CLAUDE.md`. Create `README.md`, `docs/architecture.md`, `docs/security.md`, `docs/test-matrix.md`, `docs/loom-script.md`, and `docs/build-log.md`.

README must state that GrowthFlow Media and all records are fictional.

**Primary files/artifacts:**
- `CLAUDE.md`
- `README.md`
- `docs/*`

### 4. Create final folder structure

Create the folder tree from Section 6. Add modules only where a concrete implementation will follow; avoid meaningless empty index files.

Create `.env.example` with the exact variable names from Section 7.

**Primary files/artifacts:**
- `src/lib/*`
- `tests/*`
- `n8n/*`
- `bruno/*`
- `.env.example`

### 5. Configure quality scripts and smoke test

Add scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `test:watch`, and `test:e2e`. Configure Vitest. Add one meaningful smoke unit test for a small utility rather than a dummy `true === true` test.

**Primary files/artifacts:**
- `vitest.config.ts`
- `tests/unit/*`
- `package.json`

### End-of-day acceptance

- [ ] `npm run dev` starts cleanly.
- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] No secret exists in Git.
- [ ] CLAUDE.md is committed before business implementation.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
