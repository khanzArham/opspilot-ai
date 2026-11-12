# OpsPilot AI — Security, Observability, Testing & CI

**Single source of truth for logging/audit rules, security controls, tests, Git workflow, and CI.**

# 25. Observability and Audit

Every main flow uses a `correlationId`.

Sources:
- event ID for onboarding when possible
- generated UUID for tickets/reports
- job ID for job execution
- diagnosis ID for remediation

Log:
- route start/end
- workflow run ID
- correlation ID
- safe status
- stable error code
- duration
- job attempt number

Never log:
- secrets
- auth tokens
- full request headers
- Gemini API key
- Telegram token
- Supabase secret key

The UI must make database state inspectable; console logs are not the only observability mechanism.

---

---

# 26. Security Contract

1. Synthetic data only.
2. All mutation endpoints validate Zod schemas.
3. All protected endpoints authenticate.
4. Admin-only endpoints check admin server-side.
5. RLS enabled on application tables.
6. Server keys never imported into Client Components.
7. Cron endpoint uses timestamped HMAC authentication.
8. n8n endpoint uses a dedicated high-entropy shared secret.
9. Constant-time comparison for machine secrets/signatures.
10. No raw provider error objects returned to browser.
11. AI context is sanitized.
12. AI output is schema validated.
13. AI recommendations require human approval.
14. Deterministic executor only.
15. No automatic AI support send.
16. No arbitrary SQL/code execution.
17. `.env*` ignored except `.env.example`.
18. Secret scan before public Git push and Loom recording.

---

---

# 27. Testing Strategy — FINAL

## 27.1 Unit tests — Vitest

Required unit coverage:

### Validation
- valid Deal Won payload
- missing event ID
- unsupported schema version
- invalid email
- valid ticket
- oversized ticket

### Normalization
- email lowercase/trim
- external ID trim
- canonical payload hash is stable

### Ticket rules
- billing classification
- access classification
- technical classification
- urgent priority
- high priority
- default low priority

### Retry policy
- attempt 1 -> 1 minute
- attempt 2 -> 5 minutes
- attempt 3 -> 15 minutes
- attempt 4 -> dead-letter

### Failure classifier
- 429 retryable
- 503 retryable
- timeout retryable
- invalid payload permanent
- unsupported job permanent

### AI
- valid ticket structured output
- invalid AI output fallback
- diagnosis allow-list validation
- sanitizer strips sensitive keys

### Remediation
- safe retry mapping
- no-action mapping
- invalid action impossible by schema

## 27.2 Integration-focused tests

Use the hosted Supabase development project with synthetic test prefixes and cleanup.

Required:
- event ID unique behavior
- business duplicate unique behavior
- onboarding task unique behavior
- atomic claim does not double-claim
- expired lease can be reclaimed
- job attempt history persists
- approval decision uniqueness
- RLS denial for unauthorized mutation

## 27.3 API tests

Bruno collection must cover:
- login-assisted dev workflow documentation
- Deal Won
- replay
- same client new event
- ticket
- diagnose
- decision
- report
- n8n machine endpoint
- invalid auth
- invalid payload

## 27.4 E2E tests — Playwright

Required reviewer-flow E2E:

### E2E-01 Authentication
- logged-out dashboard redirects to login
- admin can sign in
- operator can sign in

### E2E-02 Onboarding
- Send New Deal
- row appears
- tasks exist

### E2E-03 Idempotency
- Replay Same Event
- counts do not increase

### E2E-04 Business dedupe
- Same Client New Event
- client count unchanged

### E2E-05 Permanent failure
- create permanent failure
- process queue
- job reaches dead-letter

### E2E-06 Diagnosis approval
- admin diagnoses
- proposal appears
- approve
- deterministic result visible

### E2E-07 Operator boundary
- operator cannot use diagnose/approve endpoint

## 27.5 Quality command

Before every day is complete:

```bash
npm run lint && npm run typecheck && npm test
```

Before major milestones:

```bash
npx playwright test
```

---

---

# 28. Git and CI Contract

## 28.1 Branching

Use:
- `main` = stable
- one short-lived branch per build day:
  - `day-01-foundation`
  - `day-02-database`
  - etc.

Merge only after day acceptance checks pass.

## 28.2 Commit style

Examples:
- `chore: initialize opspilot project foundation`
- `feat: add idempotent deal won processing`
- `feat: add atomic postgres job claims`
- `test: cover duplicate client race behavior`
- `fix: prevent expired lease double processing`

## 28.3 GitHub Actions

`quality.yml` runs on push/PR:
1. checkout
2. setup Node 26
3. `npm ci`
4. `npm run lint`
5. `npm run typecheck`
6. `npm test`

E2E is run locally for the portfolio MVP so CI does not require production secrets.

---
