# OpsPilot AI

Internal operations autopilot: a portfolio project that turns operational events into durable, inspectable workflows instead of just calling an LLM.

> **Fictional data notice.** GrowthFlow Media is a fictional company. All clients, users, emails, tickets and metrics in this repository are synthetic (`.example` domains only). There are no real users, no real clients, no adoption and no measured business impact.

**Status:** work in progress (Day 1 of a 14-day build). See [`docs/build-log.md`](docs/build-log.md) for history.

## What it will demonstrate

- Deal-won event intake with event-ID idempotency and separate business-level duplicate protection
- A PostgreSQL job queue with atomic lease-based claims, fixed retry backoff and a dead-letter queue
- Deterministic support-ticket triage, with Gemini enrichment that is schema-validated and review-only
- AI failure diagnosis limited to a fixed action allow-list, with human admin approval and deterministic remediation
- Deterministic daily operations reports
- A demo control panel that works without local n8n
- Row Level Security, server-enforced authorization, audit trail and automated tests

## Stack

Node.js 26, TypeScript (strict), Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui, Recharts, Zod, Supabase (Postgres, Auth, Cron, Vault), Gemini via `@google/genai`, Telegram Bot API, n8n Community Edition (local Docker), Vitest, Playwright, Bruno, GitHub Actions, Vercel Hobby. The budget is $0.

## Getting started

Requires Node.js 26 (see `.nvmrc`).

```bash
npm ci
cp .env.example .env.local   # fill in your own values; never commit this file
npm run dev
```

Open <http://localhost:3000>.

Environment variable names are listed in `.env.example` (added in Day 1 Step 4). Real values must never be committed.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |

`typecheck`, `test`, `test:watch` and `test:e2e` are added in Day 1 Step 5.

## Documentation

- [`CLAUDE.md`](CLAUDE.md): engineering contract for AI-assisted development
- [`docs/architecture.md`](docs/architecture.md): scope, locked stack and ownership
- [`docs/security.md`](docs/security.md): security posture
- [`docs/test-matrix.md`](docs/test-matrix.md): test coverage plan and status
- [`docs/loom-script.md`](docs/loom-script.md): demo walkthrough script
- [`docs/build-log.md`](docs/build-log.md): build history

## License

Not yet specified.
