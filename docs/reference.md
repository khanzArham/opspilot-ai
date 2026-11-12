# OpsPilot AI — Final Reference & Definition of Done

**Read for final review, performance/scalability questions, limitations, or architecture rationale. Do not load by default.**

# 30. Definition of Done — FINAL

The project is complete only when every item below is true.

## Architecture
- [ ] Backend/database own canonical state.
- [ ] n8n is orchestration only.
- [ ] No business rule is implemented only in UI.
- [ ] No external queue service is required.

## Auth/security
- [ ] Supabase email/password login works.
- [ ] Admin and operator roles are server-enforced.
- [ ] RLS enabled.
- [ ] Server keys absent from browser.
- [ ] Cron HMAC authentication works.
- [ ] n8n machine secret works.
- [ ] No secrets committed.
- [ ] Logs are sanitized.

## Onboarding
- [ ] First Deal Won creates canonical client.
- [ ] Four starter tasks created.
- [ ] Exact replay is idempotent.
- [ ] Same client/new event dedupes business entity.
- [ ] Payload mismatch on reused event ID returns 409.
- [ ] First onboarding queues one notification job.

## Jobs
- [ ] Queue rows are durable.
- [ ] Atomic claim uses `SKIP LOCKED`.
- [ ] Lease expiry recovery works.
- [ ] Attempt history works.
- [ ] 1m/5m/15m retry schedule works.
- [ ] Permanent errors dead-letter.
- [ ] Worker processes batches safely.
- [ ] Supabase Cron runs hosted worker.

## Tickets
- [ ] Deterministic triage works without AI.
- [ ] Gemini structured output works.
- [ ] AI invalid output falls back safely.
- [ ] AI provider outage does not lose ticket.
- [ ] Suggested reply is review-only.

## Failure diagnosis
- [ ] Dead-letter job can be diagnosed by admin.
- [ ] Operator is denied.
- [ ] Context is sanitized.
- [ ] AI output uses fixed schema.
- [ ] Only five allowed actions exist.
- [ ] Fallback diagnosis is NO_ACTION.

## Approval/remediation
- [ ] Human decision is required.
- [ ] One immutable decision per diagnosis.
- [ ] State revalidation occurs before execution.
- [ ] Deterministic action mapping works.
- [ ] Safe retry requeues correctly.
- [ ] Every decision is audited.

## Reporting/UI
- [ ] Daily report works from stored metrics.
- [ ] Dashboard shows operational state.
- [ ] Demo Control Panel supports all 13 scenarios.
- [ ] Synthetic reset works safely.

## n8n
- [ ] Deal Won Orchestrator works locally.
- [ ] Daily Report Messenger works locally.
- [ ] Both JSON exports committed.
- [ ] Public demo does not require n8n runtime.

## Testing
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Unit tests pass.
- [ ] Required integration-focused checks pass.
- [ ] Critical Playwright E2E passes.
- [ ] Failure injection tested.

## Portfolio
- [ ] Vercel deployment works.
- [ ] README is complete.
- [ ] CLAUDE.md is present.
- [ ] Architecture/security docs match implementation.
- [ ] Authentic Claude Code evidence exists.
- [ ] 2–3 minute Loom is recorded.
- [ ] No claim of real clients, real adoption, or measured business impact.

---

---

# 33. Claude Coding Standards

## TypeScript
- `strict: true`
- avoid `any`
- use discriminated unions for domain outcomes/errors
- parse unknown external input with Zod
- functions should return explicit domain results
- server-only modules should be clearly isolated

## Naming
- TypeScript variables/functions: camelCase
- React components/types: PascalCase
- SQL tables/columns: snake_case
- stable error codes: UPPER_SNAKE_CASE
- audit event names: UPPER_SNAKE_CASE
- files: kebab-case unless framework convention requires otherwise

## Route handlers
Route handler responsibility:
1. auth
2. parse/validate
3. call domain service
4. map domain result/error to HTTP
5. return normalized envelope

Do not place full business workflows inside `route.ts`.

## Domain services
- no JSX
- no direct UI assumptions
- no unvalidated request objects
- no secret logging
- explicit transaction boundaries
- testable provider interfaces

## Database
- migrations are source of truth
- no manual-only schema changes
- unique constraints protect invariants
- use database transaction/locking when concurrency matters
- avoid N+1 query patterns in dashboard/report endpoints

---

---

# 34. Performance and Scalability Rules

The MVP is optimized for correctness and a small portfolio workload, but the design must scale cleanly.

1. Keep API routes stateless.
2. Persist durable work before external calls.
3. Batch worker claims to 10.
4. Keep leases short and recoverable.
5. Use indexes on queue, event, client and time-window report queries.
6. Prefer SQL aggregation over fetching thousands of rows into Node.
7. Keep job payloads small.
8. Do not hold a Vercel request open for retry sleeps.
9. Use provider timeouts.
10. Avoid sequential external calls when they are independent, but do not parallelize state mutations that require ordering.
11. Do not fetch entire audit history on the dashboard; paginate.
12. Default operational table page size: 25.
13. Cap API page size at 100.
14. Report queries operate on a bounded date range.
15. Do not use Realtime subscriptions in the MVP; refresh after actions and use normal server rendering/fetching.
16. Do not add caching around mutable operational states until correctness is proven.

---

---

# 35. Known MVP Limitations

These limitations must be stated honestly:

- Synthetic data only.
- n8n is local and not always-on.
- Vercel Hobby is a portfolio/personal deployment, not a commercial SLA.
- Supabase Free may pause after inactivity.
- Gemini free-tier availability/rate limits can change.
- No real CRM integration.
- No customer-facing auto-reply sending.
- No production multi-tenancy.
- No claim of exactly-once delivery over the network; the system targets effectively-once business effects through idempotency and uniqueness.
- No production-scale load testing is claimed.
- No real user adoption is claimed.

---

---

# 36. Final Architecture Rationale

## Why Next.js modular monolith?
One deployable app is easier to understand, cheaper to host, and faster to finish than multiple services. Domain modules still create clean separation.

## Why Supabase?
It combines managed PostgreSQL, Auth, RLS, Cron, Vault and database functions under a free portfolio tier. PostgreSQL gives the project real concurrency and integrity primitives.

## Why no ORM?
The project needs visible SQL constraints, RLS, migrations, RPC job claims and Postgres-specific locking. `supabase-js` plus SQL migrations keeps these concepts explicit and avoids an unnecessary abstraction layer.

## Why DB-backed queue?
The queue is durable, inspectable, free and sufficient for the portfolio workload. It demonstrates the exact reliability concepts the project is intended to showcase.

## Why Supabase Cron instead of Vercel Cron?
The queue state already lives in Supabase/Postgres. Supabase Cron is database-native, supports frequent recurring work and HTTP invocation, and keeps scheduling close to durable job state. Vercel remains focused on serving the application and worker endpoint.

## Why Gemini 3.8 Flash?
The project needs fast structured classification/summarization/diagnosis rather than heavyweight long-running reasoning. The current Flash model provides strong capability with a free developer tier suitable for synthetic portfolio data.

## Why Interactions API?
It is the current recommended Gemini API for new projects and supports structured outputs cleanly.

## Why human approval?
Failure diagnosis is probabilistic. Human approval plus a fixed action allow-list prevents model output from directly changing operational state.

## Why n8n local only?
The goal is to demonstrate workflow automation skill without paying for cloud hosting. The production-like public demo remains reproducible even when local n8n is offline.

---

---

# 37. Current Platform Validation Record

This architecture was locked after checking current official platform documentation on 2026-11-11.

- Next.js 16 is an Active LTS release.
- Node.js 26 is LTS.
- Vercel Hobby is $0 and intended for personal/non-commercial projects.
- Supabase has a $0 Free plan and hosted PostgreSQL/Auth.
- Supabase Cron supports recurring jobs and HTTP requests.
- Supabase Vault supports encrypted database-side secrets.
- `@supabase/ssr` is the documented package for cookie-based Next.js sessions.
- Gemini Interactions API is the recommended API for new projects.
- Gemini 3.8 Flash has a free developer tier at the time of this revision.
- Gemini structured outputs support JSON Schema and application-side Zod validation.
- n8n Community Edition can be self-hosted locally.

Official references:
- https://nextjs.org/support-policy
- https://nodejs.org/en/about/previous-releases
- https://vercel.com/pricing
- https://vercel.com/legal/terms
- https://supabase.com/pricing
- https://supabase.com/docs/guides/auth/server-side
- https://supabase.com/docs/guides/cron
- https://supabase.com/docs/guides/database/vault
- https://supabase.com/docs/guides/database/extensions/pg_net
- https://ai.google.dev/gemini-api/docs/interactions-overview
- https://ai.google.dev/gemini-api/docs/structured-output
- https://ai.google.dev/gemini-api/docs/pricing
- https://docs.n8n.io/

---

---

# 38. Final Instruction to Claude

Build this project as a **reliable AI-native operations system**, not as an AI gimmick.

The priority order is:

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

When uncertain, choose the implementation that preserves these priorities and stays inside the locked architecture above.

**Do not offer alternative stacks. Do not widen scope. Complete the 14-day plan in order.**
