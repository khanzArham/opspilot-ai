# OpsPilot AI — Day 12 Execution Plan

## Context to load

Read this day file plus only the following source-of-truth specs before implementation:

- `docs/architecture.md`
- `docs/api-contracts.md`
- `docs/workflows.md`
- `docs/security-testing.md`

Do **not** load other day plans unless debugging a dependency from that day.

## Execution rule

Implement this day sequentially. Complete one step, run the relevant checks, update `docs/STATUS.md`, then move to the next step.

---

## Day 12 — n8n Workflows, Bruno Collection and Deployment Hardening

### 1. Run n8n Community Edition locally with Docker

Create a local Docker setup documented in `n8n/README.md`. Persist local n8n data outside Git. Do not commit credentials.

**Primary files/artifacts:**
- `n8n/README.md`
- `.gitignore`

### 2. Build Deal Won Orchestrator

Create the exact node flow from Section 21.1. Use the dedicated machine endpoint and n8n secret. Test first event, replay and business duplicate branches.

**Primary files/artifacts:**
- `n8n/deal-won-orchestrator.json`

### 3. Build Daily Report Messenger

Create the exact node flow from Section 21.2. Call `POST /api/integrations/n8n/daily-report` with `X-OpsPilot-N8N-Secret`, format the returned deterministic metrics, and send the summary to Telegram.

**Primary files/artifacts:**
- `n8n/daily-report-messenger.json`

### 4. Create Bruno API collection

Commit requests for all important API contracts and negative cases. Reference environment variable names, never real secrets.

**Primary files/artifacts:**
- `bruno/OpsPilot/*`

### 5. Deploy Next.js to Vercel Hobby

Connect GitHub repo, configure environment variables, deploy production. Verify server routes run on Node runtime and dashboard/auth work.

**Primary files/artifacts:**
- `Vercel deployment`

### 6. Configure hosted Supabase Cron target

Put deployed `APP_BASE_URL` and the matching cron signing secret into Supabase Vault. Activate the every-minute worker cron. Verify the cron history and a real queued job.

**Primary files/artifacts:**
- `Supabase Cron/Vault`

### End-of-day acceptance

- [ ] Public dashboard works without n8n online.
- [ ] Both n8n workflows import successfully.
- [ ] Workflow JSON exports are committed.
- [ ] Vercel deployment works.
- [ ] Supabase Cron processes a hosted queued job.

### Required close-out

- Run lint, typecheck and relevant tests.
- Update `docs/build-log.md` with completed work, tests run, and any issue discovered.
- Commit with a descriptive message.
- Merge the day's branch to `main` only after checks pass.
