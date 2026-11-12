# OpsPilot AI — Security

Public-facing summary of the security posture. The detailed contract lives in [`security-testing.md`](security-testing.md). Items are marked **Planned** until implemented and tested; this file must not claim controls that do not exist yet.

## Scope and data

- Synthetic data only; GrowthFlow Media is fictional. Demo emails use `.example` domains.
- No real customer data, credentials or provider payloads are stored or committed.

## Secrets handling

| Rule | Status |
|---|---|
| `.env*` ignored by Git; only `.env.example` (names, no values) is tracked | In place |
| Public-repo `.gitignore` covers keys, certs, Supabase local state and n8n data | In place |
| Secret scan before every public push and before recording the Loom | Process; run manually until CI check is added |
| Server-only keys (Supabase secret, Gemini, Telegram, n8n, cron) never reach the browser | Planned |
| No secrets in logs, tests, screenshots, README or seed data | Ongoing |

## Authentication and authorization

| Rule | Status |
|---|---|
| Supabase Auth email/password with cookie-based SSR sessions | In place (login, logout, request proxy, dashboard gate) |
| Roles `admin` and `operator`, enforced server-side; never trusted from request JSON | In place (`requireUser` / `requireRole`, role read from `profiles` via the session-scoped client) |
| RLS enabled on all application tables | In place (migrations 002 + 004; see below) |
| Core mutations only through server/domain services | In place at the database layer: browser roles have no write privileges or policies |

## Row Level Security and database privileges

Two independent layers (`supabase/migrations/004_rls.sql`), so a mistake in one does not expose data:

1. **Privileges.** `anon` has no privileges on any table. `authenticated` has `SELECT` only, and only on the tables the dashboard reads. No browser role has `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `TRIGGER` or `REFERENCES`, and `EXECUTE` on `public` functions is revoked. Default privileges are changed so future tables and functions are not auto-exposed.
2. **RLS.** Enabled on all 11 application tables. Only `SELECT` policies exist; there are no write policies anywhere.

| Table | Browser (`authenticated`) | Notes |
|---|---|---|
| `profiles` | `SELECT` own row only (`id = auth.uid()`) | Role changes are not exposed to browsers |
| `clients`, `onboarding_tasks`, `support_tickets`, `jobs`, `job_attempts`, `workflow_runs`, `audit_events` | `SELECT` for users who have a `profiles` row | A self-registered Auth user without a profile sees nothing |
| `processed_events`, `failure_diagnoses`, `approval_decisions` | No access | Read by the server after authorization |
| all tables | No `INSERT` / `UPDATE` / `DELETE` | All business mutations use the server-only secret key (`service_role`, bypasses RLS) after server-side authorization |

`requireUser()` loads the caller's role with the **session-scoped** client, so PostgreSQL itself enforces the self-read policy. The admin (secret-key) client is reserved for privileged server operations.

Verification: `supabase/verification/rls.sql` simulates `anon`, an operator, an admin and a user without a profile (34 checks, including a phase that grants write privileges on purpose to prove the RLS policies still block them). It rolls back completely.

Operational note: disable public sign-ups for the hosted Supabase project (Authentication settings) because accounts are provisioned manually. The policies already deny data to accounts without a profile, but sign-ups should not be open.

## Machine endpoints

| Rule | Status |
|---|---|
| Cron: timestamped HMAC verification | Planned |
| n8n: dedicated shared secret in `X-OpsPilot-N8N-Secret` | Planned |
| Constant-time comparison for secrets and signatures | Planned |
| Provider errors sanitized before reaching clients | Planned |

## AI safety

| Rule | Status |
|---|---|
| AI output treated as untrusted; strict Zod validation with safe fallback | Planned |
| AI context built from an allow-list, never raw payloads | Planned |
| Support replies are review-only and never auto-sent | Planned |
| Diagnosis limited to five fixed actions, requires admin approval | Planned |
| AI never executes SQL, shell, code patches or workflow edits | Planned |

## Reporting a vulnerability

This is a portfolio project with no production users. Please open a GitHub issue without including any secrets.
