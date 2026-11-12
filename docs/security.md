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
| Supabase Auth email/password with cookie-based SSR sessions | Planned |
| Roles `admin` and `operator`, enforced server-side; never trusted from request JSON | Planned |
| RLS enabled on all application tables | Planned |
| Core mutations only through server/domain services | Planned |

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
