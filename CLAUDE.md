# OpsPilot AI — CLAUDE.md
## Compact Always-On Engineering Contract

**Project:** OpsPilot AI — Internal Operations Autopilot  
**Fictional company:** GrowthFlow Media  
**Budget:** $0 portfolio MVP  
**Data:** synthetic/fake data only  
**Rule:** this file is intentionally compact. Do not load all `/docs` files by default.

---

## 1. Session Bootstrap — MUST FOLLOW

At the start of every Claude Code session:

1. Read this `CLAUDE.md`.
2. Read `docs/STATUS.md`.
3. Read **only** the current day file named in STATUS.
4. Read **only** the spec files listed under `Context to load` in that day file.
5. Inspect the existing code relevant to the active step.
6. Work on the active step only unless the human explicitly changes scope.
7. Do not recursively read every file under `docs/`.

If a bug spans modules, read the minimum extra spec needed to resolve it.

Completed day files should not be loaded unless debugging or reviewing that completed work.

---

## 2. Locked Stack — DO NOT SUBSTITUTE

| Area | Final choice |
|---|---|
| Runtime | Node.js 26 LTS |
| Language | TypeScript strict mode |
| Framework | Next.js 16 App Router |
| UI | React 19 + Tailwind CSS 4 |
| Components | shadcn/ui + Lucide React |
| Charts | Recharts |
| Package manager | npm |
| Validation | Zod |
| Database | Supabase PostgreSQL Free |
| Auth | Supabase Auth email/password |
| SSR auth | `@supabase/ssr` |
| DB client | `@supabase/supabase-js` |
| DB changes | Supabase CLI SQL migrations |
| Hosting | Vercel Hobby |
| Scheduler | Supabase Cron |
| Cron HTTP | `pg_net` |
| DB secret storage | Supabase Vault |
| Queue | PostgreSQL `jobs` + `job_attempts` |
| Atomic claim | `FOR UPDATE SKIP LOCKED` RPC |
| AI | Gemini 3.8 Flash |
| AI API | Gemini Interactions API |
| AI SDK | `@google/genai` |
| Notifications | Telegram Bot API |
| Automation | n8n Community Edition, local Docker |
| Unit tests | Vitest 5 |
| E2E | Playwright |
| API manual tests | Bruno |
| CI | GitHub Actions |
| AI coding assistant | Claude Code |

Do not add Prisma, Drizzle, Firebase, MongoDB, Redis, BullMQ, Clerk, Auth.js, Express, NestJS, Fastify, tRPC, LangChain, LangGraph, Vercel Cron, Vercel Queues, or another production AI provider.

---

## 3. Non-Negotiable Architecture Rules

1. Backend + PostgreSQL own canonical business state.
2. n8n is an orchestration/demo layer only; it does not own business rules or retries.
3. Browser code never owns authorization or canonical workflow state.
4. Validate every external request with Zod before domain logic.
5. Database constraints are the final race-condition guard.
6. Exact event replay must be idempotent.
7. Business-level duplicate protection is separate from event-id idempotency.
8. Never auto-merge two different clients when external ID and normalized email resolve to different rows; return `CLIENT_IDENTITY_CONFLICT`.
9. Unreliable external work must be persisted as jobs before execution.
10. No retry sleeps inside Vercel requests.
11. Queue claims must be atomic and lease-based.
12. Job retry policy is fixed: attempt 1 → 1m, attempt 2 → 5m, attempt 3 → 15m, attempt 4 → dead-letter.
13. AI output is untrusted and must pass strict schema validation.
14. Ticket classification is deterministic first; AI only enriches.
15. AI-generated support replies are review-only and never auto-sent.
16. AI failure diagnosis may recommend only the five allowed actions defined in `docs/workflows.md`.
17. AI never executes SQL, shell commands, code patches, workflow edits, or arbitrary actions.
18. Diagnosis remediation requires human admin approval.
19. Approved remediation executes pre-written deterministic backend code only.
20. Keep the public demo usable even when local n8n is offline.
21. Use synthetic `.example` data only.
22. Never claim real users, real clients, adoption, or measured business impact.

---

## 4. Security Rules

- Never expose Supabase secret key, Gemini key, Telegram token, cron secret, or n8n secret to the browser.
- Never commit secrets, passwords, `.env`, provider tokens, or auth headers.
- Do not print secrets in tests, logs, screenshots, README, Loom, or seed data.
- Admin/operator authorization is server-enforced.
- RLS is required as defense in depth.
- Machine endpoints use their defined server-side authentication.
- Cron uses timestamped HMAC verification.
- Sanitize provider errors before returning them to clients.
- AI context is allow-list constructed; never forward arbitrary secret-bearing payloads.
- Core mutations go through server/domain services, not direct browser table writes.

---

## 5. Claude Coding Rules

Before editing:
- inspect relevant files
- state active step and acceptance criteria
- identify files to change and tests to run

While editing:
- make the smallest coherent change
- keep route handlers thin: auth → validate → domain service → HTTP mapping
- keep business logic in domain modules
- avoid `any`
- do not duplicate domain rules across UI/API/n8n
- add/update tests with behavior changes
- never silently redesign the stack

After editing:
- run relevant tests
- run `npm run lint`
- run `npm run typecheck`
- run Playwright when reviewer flow changes
- report exact pass/fail results
- update `docs/STATUS.md`
- append a concise entry to `docs/build-log.md`
- do not declare completion while required checks fail

---

## 6. Context Router

Read these files only when relevant:

| File | Source of truth for |
|---|---|
| `docs/architecture.md` | scope, locked stack rationale, ownership, auth model, repo/environment |
| `docs/database.md` | tables, constraints, indexes, RLS, DB invariants |
| `docs/api-contracts.md` | endpoints, envelopes, status codes, stable error taxonomy |
| `docs/workflows.md` | onboarding, tickets, queue, jobs, cron, AI diagnosis, remediation, reports, n8n, demo UI |
| `docs/security-testing.md` | observability, security, test matrix, Git/CI |
| `docs/loom-script.md` | final portfolio Loom only |
| `docs/reference.md` | Definition of Done, performance rules, limitations, rationale, validated platform notes |
| `docs/plan/day-XX.md` | detailed implementation steps for one day |
| `docs/STATUS.md` | active day/step, completed work, next task, latest verification |

**Precedence:** `CLAUDE.md` → relevant source-of-truth doc → current day plan → existing implementation.  
If two detailed docs conflict, stop and surface the conflict instead of guessing.

---

## 7. Locked Product Behavior Summary

### Deal Won
Validate → reserve event ID → compare payload hash on conflict → resolve canonical client → create four unique onboarding tasks → enqueue one onboarding notification for first onboarding → audit → persist result.

### Ticket
Validate → deterministic category/priority → persist baseline ticket → optional Gemini structured enrichment → schema validate → safe fallback on AI failure → human review required.

### Jobs
Postgres queue → atomic batch claim (10) → 120s lease → attempt record → handler → success / fixed backoff / dead-letter.

### Diagnosis
Admin only → dead-letter job only → sanitized context → Gemini structured diagnosis → allowed action only → pending approval → admin decision → deterministic remediation → audit.

### Reporting
Database-backed deterministic metrics. No LLM is required or used for report calculation.

---

## 8. Fixed AI Remediation Actions

Only these values are valid:

- `REQUEST_DATA_CORRECTION`
- `SCHEDULE_SAFE_RETRY`
- `REQUEST_REAUTH`
- `ESCALATE_LOGIC_BUG`
- `NO_ACTION`

No model-generated command is executable.

---

## 9. Quality Gate

Normal step completion:

```bash
npm run lint
npm run typecheck
npm test
```

Run critical E2E when the changed behavior affects the reviewer journey:

```bash
npx playwright test
```

A day is complete only when its own acceptance checklist passes.

---

## 10. Scope Guard

Do not add during the 14-day MVP:

- RAG/vector search
- multi-agent frameworks
- autonomous remediation
- real CRM integrations
- payments/billing
- multi-tenant SaaS features
- custom queue infrastructure
- paid hosting/services
- customer-facing auto-send
- production claims unsupported by evidence

Finish the current 14-day plan before expanding scope.

---

## 11. Status Discipline

`docs/STATUS.md` is the only current-progress file.

At the end of each completed step, update:
- current day
- current step
- completed items
- next task
- files changed
- tests last verified
- blockers/known issues

Keep STATUS short. Do not paste implementation history into it; history belongs in `docs/build-log.md`.

---

## 12. Final Priority Order

When making engineering tradeoffs, preserve this order:

1. correctness
2. security
3. durable state
4. idempotency
5. failure recovery
6. auditability
7. deterministic fallback
8. human control
9. testability
10. UI polish
11. extra AI cleverness

**Do not offer alternative stacks. Do not widen scope. Follow the current day plan in order.**
