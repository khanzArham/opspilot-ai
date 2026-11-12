# OpsPilot AI — Architecture & Platform Specification

**Load only when the current task touches architecture, auth, environment, stack, scope, or repository structure.**

# 1. Project Overview

OpsPilot AI is a portfolio-grade internal operations system for a fictional agency, **GrowthFlow Media**. It demonstrates how a modern AI-native engineer builds reliable automation rather than merely calling an LLM.

The product converts operational events into durable, inspectable workflows:

- A fictional CRM sends a **Deal Won** event.
- OpsPilot validates and deduplicates the event.
- It creates or reuses a canonical client.
- It creates onboarding tasks exactly once per client/task key.
- It queues unreliable external work instead of blocking the request.
- A database-backed worker processes jobs with leases, retry policy, attempt history, and dead-letter handling.
- Support tickets receive deterministic triage first.
- Gemini may enrich a ticket with a summary and suggested reply, but the reply remains human-review-only.
- Dead-lettered jobs can be analyzed by an AI Failure Diagnosis Agent.
- The diagnosis is constrained to a fixed action allow-list.
- An admin must approve or reject the proposal.
- The backend revalidates the decision and executes a deterministic remediation.
- A daily operations report summarizes persisted workflow metrics.
- A Demo Control Panel exposes every important happy path and failure path without requiring local n8n.
- n8n is committed as an automation artifact and can orchestrate backend calls when run locally.

## 1.1 What this project must prove

The final portfolio must visibly prove:

- Full-stack TypeScript/JavaScript engineering.
- Secure server-side authentication and authorization.
- PostgreSQL schema design and invariants.
- Event idempotency and business-level deduplication.
- Asynchronous job processing.
- Retry/backoff and dead-letter design.
- Atomic job claiming with leases.
- AI structured output and deterministic fallback.
- Bounded AI autonomy and human approval.
- n8n workflow automation.
- Vercel-compatible APIs and deployment.
- Scheduled operations.
- Auditability and operational observability.
- Automated testing.
- Claude Code-assisted development with an explicit engineering contract.

---

---

# 2. Final Scope

## 2.1 Required MVP modules

1. Authentication and roles.
2. Deal-won client onboarding.
3. Business duplicate protection.
4. Onboarding task creation.
5. Persistent job queue.
6. Telegram notification job.
7. Support ticket intake and deterministic triage.
8. Gemini ticket enrichment.
9. Dead-letter queue.
10. AI Failure Diagnosis Agent.
11. Human approval/rejection workflow.
12. Deterministic remediation executor.
13. Daily operations report.
14. Demo Control Panel.
15. n8n Deal-Won Orchestrator workflow.
16. n8n Daily Report Messenger workflow.
17. Audit trail and operational status UI.
18. Unit, integration-focused, and E2E tests.
19. GitHub Actions quality workflow.
20. Vercel deployment.
21. README, architecture notes, exported n8n workflows, and Loom evidence.

## 2.2 Explicit non-goals

Do not build:
- Real CRM integrations.
- Payments.
- Real customer data ingestion.
- SaaS multi-tenancy.
- Billing.
- RAG/vector search.
- Autonomous remediation.
- Autonomous code editing.
- Autonomous SQL execution.
- AI-generated workflow mutation.
- Auto-sent AI support replies.
- A separate microservice fleet.
- Kafka/Redis/RabbitMQ.
- A paid VPS.
- Paid n8n Cloud.
- Paid AI quota.
- Custom domain.
- Mobile app.
- WebSockets unless a later portfolio version specifically requires them.

---

---

# 3. Final Technology Stack — LOCKED

| Layer | Final choice | Why it is locked |
|---|---|---|
| Runtime | **Node.js 26 LTS** | Current LTS, strong Node ecosystem, aligned with the target role. |
| Language | **TypeScript, strict mode** | Safer refactoring, explicit contracts, better Claude-assisted work. |
| App framework | **Next.js 16 App Router** | Active LTS, React + API route handlers in one deployable project. |
| UI | **React 19 + Tailwind CSS 4** | Fast dashboard development with minimal runtime overhead. |
| UI components | **shadcn/ui + Lucide React** | Accessible, local component code, no paid dependency. |
| Charts | **Recharts** | Simple React-native operations charts. |
| Package manager | **npm** | Familiar, universally supported, no extra tooling decision. |
| Validation | **Zod** | Shared runtime validation for requests and AI responses. |
| Database | **Supabase PostgreSQL Free** | Managed Postgres, constraints, functions, Auth, RLS, Cron. |
| Auth | **Supabase Auth email/password** | Simple deterministic demo accounts and server sessions. |
| SSR auth package | **@supabase/ssr** | Correct cookie-based Next.js session handling. |
| DB/API client | **@supabase/supabase-js** | Official client; no ORM added. |
| Database changes | **Supabase CLI SQL migrations** | Version-controlled schema and policies. |
| Backend | **Next.js Route Handlers + domain services** | Modular monolith; no second server to host. |
| Hosting | **Vercel Hobby** | $0 personal portfolio hosting, automatic CI/CD, Node Functions. |
| Scheduler | **Supabase Cron** | Database-native recurring scheduler that can make HTTP calls. |
| Cron HTTP | **pg_net** | Supabase-supported asynchronous HTTP invocation from Postgres. |
| Cron secret storage | **Supabase Vault** | Encrypted-at-rest secret storage for database-side scheduling. |
| Queue | **PostgreSQL `jobs` + `job_attempts` tables** | Durable, inspectable, free, no external queue service. |
| Job claim | **Postgres RPC using `FOR UPDATE SKIP LOCKED`** | Atomic concurrent worker safety. |
| AI model | **Gemini 3.8 Flash** | Strong current Flash model with free developer tier. |
| AI API | **Gemini Interactions API** | Current recommended API for new Gemini projects. |
| AI SDK | **@google/genai** | Official JavaScript/TypeScript SDK. |
| AI structured output | **JSON Schema + Zod validation** | Predictable and safe model integration. |
| Notification | **Telegram Bot API** | Free external integration suitable for a portfolio demo. |
| Workflow automation | **n8n Community Edition in Docker, local only** | Shows n8n skill without paid hosting; exports committed to Git. |
| Unit/integration test runner | **Vitest 5** | Fast modern TypeScript testing. |
| E2E | **Playwright** | Reviewer-flow browser testing. |
| API manual testing | **Bruno** | Version-controlled local API collection. |
| CI | **GitHub Actions** | Free portfolio CI for lint/type/unit tests. |
| Version control | **Git + GitHub** | Required portfolio evidence. |
| AI coding assistant | **Claude Code** | Primary implementation copilot; this file governs it. |

## 3.1 Stack decisions Claude must not change

Claude must not add:
- Prisma
- Drizzle
- Firebase
- MongoDB
- Redis
- BullMQ
- Clerk
- Auth.js
- Express
- NestJS
- Fastify
- tRPC
- LangChain
- LangGraph
- OpenAI SDK
- Anthropic API as an application dependency
- Vercel Cron
- Vercel Queues
- Supabase Edge Functions for core business logic
- another chart library
- another test runner

The application intentionally uses a **modular monolith** to keep the architecture clear, zero-cost, and shippable in 14 days.

---

---

# 4. Cost and Hosting Contract

The MVP must remain at **$0**.

## 4.1 Production-like portfolio deployment

- **Vercel Hobby:** deploy the Next.js application and route handlers.
- **Supabase Free:** host Postgres, Auth, RLS, Vault, pg_cron, and pg_net.
- **Gemini free developer tier:** use only synthetic/sanitized demo content.
- **Telegram Bot API:** external notification transport.
- **n8n Community Edition:** run locally through Docker only; never make the public demo depend on it.
- **GitHub:** repository and Actions.
- **Loom free recording:** 2–3 minute application evidence.

## 4.2 Cost safety rules

- Never enable a paid plan for the MVP.
- Never add billing details merely to increase quota.
- Never build a keep-alive abuse mechanism for free services.
- If a free quota is temporarily unavailable, core deterministic behavior must still work and AI-dependent UI must show a graceful provider-unavailable state.
- Vercel Hobby is for personal/non-commercial use. This deployment is a personal portfolio demo, not a paid customer production system.
- Supabase Free projects can pause after inactivity. Before a scheduled interview/demo, manually verify the project is active.

---

---

# 5. Final System Architecture

```mermaid
flowchart LR
    U[Admin / Operator Browser] --> N[Next.js 16 App on Vercel]
    N --> A[Supabase Auth]
    N --> D[(Supabase PostgreSQL)]
    N --> G[Gemini 3.8 Flash]
    N --> T[Telegram Bot API]

    C[Supabase Cron] -->|HMAC signed POST| W[/api/internal/jobs/process]
    W --> D
    W --> T
    W --> G

    X[n8n Community Edition - Local] -->|Machine-auth HTTP| N
    X --> T

    D --> V[Vault]
    D --> P[pg_cron + pg_net]
    P --> C

    N --> UI[Demo Control Panel]
```

## 5.1 Canonical ownership

### Next.js/domain layer owns
- input validation
- authentication checks
- role authorization
- event processing orchestration
- client dedupe behavior
- ticket triage rules
- job handler behavior
- retry classification
- AI invocation policy
- diagnosis approval rules
- remediation commands
- report calculation
- normalized API responses

### PostgreSQL owns
- uniqueness
- relational integrity
- queue durability
- row locking
- status persistence
- attempt history
- RLS
- scheduling metadata
- audit records
- transaction safety

### n8n owns
- local workflow demonstration
- invoking approved HTTP endpoints
- simple branching around backend responses
- local scheduled report messaging
- Telegram workflow visualization

### n8n must never
- write directly to protected business tables
- implement business dedupe
- own retry policy for OpsPilot jobs
- decide user authorization
- create or execute remediation SQL
- hold canonical workflow state

### Gemini owns only
- ticket summary
- suggested support reply
- failure classification recommendation
- failure explanation
- remediation recommendation from a fixed allow-list

Gemini never owns execution.

---

---

# 6. Final Repository Structure

```text
opspilot-ai/
├─ CLAUDE.md
├─ README.md
├─ .env.example
├─ package.json
├─ next.config.ts
├─ tsconfig.json
├─ eslint.config.mjs
├─ vitest.config.ts
├─ playwright.config.ts
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  └─ login/page.tsx
│  │  ├─ dashboard/
│  │  │  ├─ page.tsx
│  │  │  ├─ clients/page.tsx
│  │  │  ├─ tickets/page.tsx
│  │  │  ├─ jobs/page.tsx
│  │  │  ├─ failures/page.tsx
│  │  │  └─ reports/page.tsx
│  │  └─ api/
│  │     ├─ events/deal-won/route.ts
│  │     ├─ tickets/route.ts
│  │     ├─ jobs/[id]/diagnose/route.ts
│  │     ├─ diagnoses/[id]/decision/route.ts
│  │     ├─ reports/daily/route.ts
│  │     ├─ demo/scenarios/[scenario]/route.ts
│  │     ├─ integrations/n8n/deal-won/route.ts
│  │     ├─ integrations/n8n/daily-report/route.ts
│  │     └─ internal/jobs/process/route.ts
│  ├─ components/
│  │  ├─ layout/
│  │  ├─ dashboard/
│  │  ├─ demo-control/
│  │  ├─ clients/
│  │  ├─ tickets/
│  │  ├─ jobs/
│  │  ├─ failures/
│  │  └─ reports/
│  ├─ lib/
│  │  ├─ auth/
│  │  │  ├─ require-user.ts
│  │  │  ├─ require-role.ts
│  │  │  └─ roles.ts
│  │  ├─ supabase/
│  │  │  ├─ browser.ts
│  │  │  ├─ server.ts
│  │  │  └─ admin.ts
│  │  ├─ validation/
│  │  │  ├─ deal-won.ts
│  │  │  ├─ ticket.ts
│  │  │  ├─ diagnosis.ts
│  │  │  └─ common.ts
│  │  ├─ domain/
│  │  │  ├─ onboarding/
│  │  │  ├─ tickets/
│  │  │  ├─ jobs/
│  │  │  ├─ diagnosis/
│  │  │  ├─ remediation/
│  │  │  └─ reports/
│  │  ├─ providers/
│  │  │  ├─ ai/
│  │  │  │  ├─ ai-provider.ts
│  │  │  │  ├─ gemini-provider.ts
│  │  │  │  ├─ fake-ai-provider.ts
│  │  │  │  └─ schemas.ts
│  │  │  └─ notifications/
│  │  │     ├─ notification-provider.ts
│  │  │     ├─ telegram-provider.ts
│  │  │     └─ fake-notification-provider.ts
│  │  ├─ errors/
│  │  ├─ audit/
│  │  ├─ crypto/
│  │  └─ utils/
├─ supabase/
│  ├─ migrations/
│  └─ seed.sql
├─ n8n/
│  ├─ deal-won-orchestrator.json
│  ├─ daily-report-messenger.json
│  └─ README.md
├─ bruno/
│  └─ OpsPilot/
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ docs/
│  ├─ architecture.md
│  ├─ security.md
│  ├─ test-matrix.md
│  ├─ loom-script.md
│  └─ build-log.md
└─ .github/
   └─ workflows/
      └─ quality.yml
```

---

---

# 7. Environment Variables — FINAL

`.env.example` must contain names only, never real values.

```bash
# Public Supabase config
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=

# Server-only Supabase access
SUPABASE_SECRET_KEY=

# Application
APP_BASE_URL=http://localhost:3000
APP_ENV=development

# Gemini
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash

# Telegram
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=

# Internal machine authentication
N8N_INTERNAL_SECRET=
CRON_SIGNING_SECRET=

# Test/runtime switches
AI_PROVIDER=gemini
NOTIFICATION_PROVIDER=telegram
```

## 7.1 Secret rules

- `NEXT_PUBLIC_*` values may appear in the browser.
- `SUPABASE_SECRET_KEY` is server-only.
- `GEMINI_API_KEY` is server-only.
- `TELEGRAM_BOT_TOKEN` is server-only.
- `N8N_INTERNAL_SECRET` is server-only.
- `CRON_SIGNING_SECRET` exists in Vercel env and matching Supabase Vault secret.
- No server-only environment variable may be imported by a Client Component.

---

---

# 8. Authentication and Authorization

## 8.1 User roles

Exactly two interactive roles exist:

```ts
type AppRole = "admin" | "operator";
```

### Admin
Can:
- view all demo operational records
- request AI failure diagnosis
- approve/reject remediation proposals
- run demo scenarios
- view audit data
- generate reports

### Operator
Can:
- run onboarding demo scenarios
- create support tickets
- view clients/tasks/tickets/jobs/reports
- observe failures
- not diagnose or approve remediation

## 8.2 System identities

### Cron worker
Authenticated with HMAC-signed request. It is not a normal Supabase user.

### n8n
Authenticated with `X-OpsPilot-N8N-Secret` header checked server-side.

## 8.3 Auth implementation

Use:
- Supabase Auth email/password.
- `@supabase/ssr` cookie-based session handling.
- `requireUser()` for protected server routes.
- `requireRole("admin")` for diagnosis/approval actions.
- server-side session verification for page protection.

Do not:
- trust a role passed in JSON
- implement a fake role dropdown as authorization
- store app role only in browser state

## 8.4 Profiles table

`profiles.id` references `auth.users.id`.

Fields:
- `id uuid primary key`
- `email text not null`
- `display_name text not null`
- `role text not null check (role in ('admin','operator'))`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

The demo uses exactly:
- one seeded admin account
- one seeded operator account

Credentials are documented privately in the developer's password manager, not in Git.

---
