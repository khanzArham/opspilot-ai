# OpsPilot AI — Workflow & Operations Specification

**Single source of truth for onboarding, tickets, queue processing, AI diagnosis, remediation, reports, n8n, and demo behavior.**

# 13. Deal-Won Onboarding Workflow

## 13.1 Required flow

1. Receive request.
2. Authenticate actor.
3. Parse body.
4. Validate with Zod.
5. Normalize external client ID and email.
6. Canonicalize JSON and calculate SHA-256 payload hash.
7. Try to insert `processed_events(event_id, status='processing')`.
8. On event ID conflict:
   - fetch existing row
   - compare payload hash
   - if hash differs -> `409 EVENT_ID_PAYLOAD_MISMATCH`
   - if hash matches -> return previous result with `eventReplay=true`
9. Create `workflow_runs` row.
10. Insert client using unique business keys.
11. Resolve business identity conflicts deterministically:
    - if external client ID and normalized email resolve to the same existing client, reuse it and set `businessDuplicate=true`
    - if only one identifier matches an existing client, reuse that canonical client and set `businessDuplicate=true`
    - if external client ID and normalized email resolve to two different existing clients, stop with `409 CLIENT_IDENTITY_CONFLICT`; never auto-merge clients
12. Create four starter onboarding tasks with conflict-safe inserts.
13. Enqueue exactly one `SEND_ONBOARDING_NOTIFICATION` job for first-time onboarding.
14. Complete workflow run.
15. Save stable result JSON into `processed_events`.
16. Write audit records.
17. Return response.

## 13.2 Business duplicate semantics

Two different event IDs can describe the same logical client.

Example:
- `evt_demo_001` + `crm_1001`
- `evt_demo_002` + `crm_1001`

Expected:
- two processed event rows
- one client row
- one set of onboarding tasks
- one initial onboarding notification job
- second response shows `businessDuplicate=true`

## 13.3 Exact replay semantics

Calling `evt_demo_001` repeatedly must not:
- create client rows
- create task rows
- create notification jobs
- rerun external side effects

Audit may record the replay.

---

---

# 14. Support Ticket Triage Workflow

## 14.1 Deterministic rules always run first

Final category rules, evaluated in this order:

1. If subject/body contains `invoice`, `billing`, `charged`, `payment` -> `billing`.
2. If contains `login`, `password`, `access`, `locked out`, `permission` -> `access`.
3. If contains `error`, `bug`, `broken`, `crash`, `integration`, `api` -> `technical`.
4. Else -> `general`.

Final priority rules:

1. If contains `security breach`, `data loss`, `production down`, `cannot access account` -> `urgent`.
2. If contains `blocked`, `outage`, `deadline today`, `cannot login` -> `high`.
3. If billing/access/technical category -> `medium`.
4. Else -> `low`.

Store `rule_reason` explaining the rule match.

## 14.2 AI enrichment

After deterministic classification:
- persist the ticket baseline
- call Gemini only after the deterministic record exists
- use Gemini 3.8 Flash
- use Gemini Interactions API
- use structured output
- validate with Zod
- use `store=false` for the interaction because server-side conversation state is unnecessary
- send only subject/body plus deterministic category/priority
- never send secrets or unrelated operational data

Expected AI schema:

```ts
const TicketAiSchema = z.object({
  summary: z.string().min(1).max(600),
  suggestedReply: z.string().min(1).max(1200),
  confidence: z.number().min(0).max(1),
  needsHumanAttention: z.boolean(),
});
```

## 14.3 AI fallback

If AI:
- times out
- throws
- returns invalid JSON
- returns schema-invalid values
- is quota-limited

Then:
- ticket remains successfully created
- deterministic category/priority remain authoritative
- `ai_status` becomes `provider_error` or `invalid_output`
- `ai_summary` becomes a deterministic compact fallback:
  `"Ticket received and routed to {category} with {priority} priority."`
- `ai_suggested_reply` remains null
- `review_status` remains `requires_review`
- write audit warning

AI failure must never turn ticket creation into a 500 after the baseline ticket is persisted.

---

---

# 15. Persistent Job Queue

## 15.1 Why this queue exists

Do not sleep inside a serverless route waiting to retry external work.

External work is persisted as a job so it survives:
- function termination
- deployment
- network failures
- provider outages
- process crashes

## 15.2 Enqueue rules

`enqueueJob()` accepts:
- `jobType`
- minimal payload containing entity IDs
- `maxAttempts` fixed to 4
- due time default `now()`

Payloads must be small and sanitized.

## 15.3 Atomic claim

Create a PostgreSQL RPC named:

`claim_due_jobs(p_worker_id text, p_batch_size integer, p_lease_seconds integer)`

Final values:
- batch size: `10`
- lease: `120 seconds`

The function must:
1. select due jobs where:
   - status is `queued` or `retry_scheduled`, OR processing lease expired
   - `next_retry_at <= now()`
2. use `FOR UPDATE SKIP LOCKED`
3. limit to 10
4. set:
   - status = `processing`
   - lease_owner = worker ID
   - lease_expires_at = now() + 120 seconds
5. return claimed rows

## 15.4 Attempt lifecycle

For each claimed job:
1. increment attempt count
2. create `job_attempts` row as `running`
3. execute explicit handler
4. on success:
   - attempt `succeeded`
   - job `succeeded`
   - clear lease
5. on failure:
   - classify failure
   - attempt `failed`
   - store safe error
   - retry or dead-letter

## 15.5 Final retry schedule

Maximum attempts: **4**

After failure:
- after attempt 1 -> retry in **1 minute**
- after attempt 2 -> retry in **5 minutes**
- after attempt 3 -> retry in **15 minutes**
- after attempt 4 -> **dead_letter**

No infinite retry.
No retry loop inside a single HTTP request.

## 15.6 Failure classification

### Retryable
- provider timeout
- network error
- HTTP 429
- HTTP 502
- HTTP 503
- HTTP 504
- temporary dependency unavailable

### Non-retryable
- invalid payload
- missing required entity
- unsupported job type
- authorization/configuration missing in a way that cannot self-recover
- invariant violation
- malformed permanent demo data

Non-retryable failures go directly to `dead_letter`.

---

---

# 16. Final Job Handlers

## 16.1 `SEND_ONBOARDING_NOTIFICATION`

Load client by ID.
Create a concise internal Telegram message.
Call Telegram Bot API.
Do not put bot token in logs.
Treat 429/5xx/network failures as retryable.
Treat invalid chat ID/config as non-retryable after validation.

Message format:

```text
✅ New client onboarding
Client: Northstar Labs
External ID: crm_1001
Tasks created: 4
OpsPilot workflow: <run-id>
```

## 16.2 `DEMO_TRANSIENT_FAILURE`

Payload contains:
- `failuresBeforeSuccess: 1`
- internal demo attempt behavior

The handler must intentionally fail with `PROVIDER_TEMPORARY_UNAVAILABLE` until the configured attempt threshold is reached, then succeed.

Used only by the Demo Control Panel.

## 16.3 `DEMO_PERMANENT_FAILURE`

Always throws a typed permanent error:
`INVALID_UPSTREAM_DATA`

It must dead-letter immediately.

## 16.4 `EXECUTE_REMEDIATION`

Payload:
- diagnosis ID
- approved action
- target job ID

The handler re-reads all records before executing.

---

---

# 17. Supabase Cron — FINAL SCHEDULER

Schedule:
- every minute: invoke job processor

Cron name:
`opspilot-process-due-jobs`

The schedule is created through a migration, not a click-only production change.

## 17.1 Security

Store in Supabase Vault:
- `opspilot_app_base_url`
- `opspilot_cron_signing_secret`

Do not send the raw secret as a request header.

The database cron function:
1. creates Unix timestamp
2. computes HMAC-SHA256 over the exact string `<timestamp>.opspilot-process-due-jobs`
3. sends:
   - `x-opspilot-timestamp`
   - `x-opspilot-signature`
4. sends the fixed JSON body `{"source":"supabase_cron"}`
5. uses `pg_net` to POST to `/api/internal/jobs/process`

The Vercel route:
1. rejects missing headers
2. rejects timestamps older than 5 minutes
3. recomputes HMAC over `<timestamp>.opspilot-process-due-jobs` using `CRON_SIGNING_SECRET`
4. compares signatures using constant-time comparison
5. ignores any caller-supplied business instructions; this route only runs the fixed due-job processor
6. processes jobs only after authentication succeeds

This prevents a copied raw database request from exposing the secret itself.

---

---

# 18. AI Failure Diagnosis Agent

## 18.1 Trigger conditions

Only an admin can request diagnosis.
The target job must be `dead_letter`.

## 18.2 Context sanitization

The diagnosis prompt may receive:
- job type
- attempt count
- last safe error code
- last safe error message
- sanitized payload
- recent attempt summaries
- relevant workflow metadata

It must not receive:
- environment variables
- raw auth headers
- tokens
- secrets
- unrelated customer records
- real personal data

## 18.3 Final AI output schema

```ts
const FailureDiagnosisSchema = z.object({
  rootCause: z.enum([
    "BAD_DATA",
    "EXPIRED_OR_INVALID_AUTH",
    "PROVIDER_UNAVAILABLE",
    "RATE_LIMIT",
    "LOGIC_BUG",
    "UNKNOWN"
  ]),
  reasoningSummary: z.string().min(1).max(1000),
  recommendedAction: z.enum([
    "REQUEST_DATA_CORRECTION",
    "SCHEDULE_SAFE_RETRY",
    "REQUEST_REAUTH",
    "ESCALATE_LOGIC_BUG",
    "NO_ACTION"
  ]),
  confidence: z.number().min(0).max(1),
  expectedImpact: z.string().min(1).max(600),
  rollbackPlan: z.string().min(1).max(600)
});
```

## 18.4 AI prompt rule

The system instruction must explicitly say:
- return only the defined schema
- never provide executable SQL
- never provide shell commands
- never provide code patches
- never propose bypassing authentication
- choose only an allowed action
- use `NO_ACTION` when evidence is insufficient

## 18.5 Fallback diagnosis

If Gemini is unavailable or invalid:
persist:

- rootCause = `UNKNOWN`
- recommendedAction = `NO_ACTION`
- confidence = `0`
- expectedImpact = `No automated remediation will occur.`
- rollbackPlan = `No state change was made.`
- status = `pending_approval`

The human can reject it and inspect manually.

---

---

# 19. Human Approval and Deterministic Remediation

AI recommendations never directly mutate the failed job.

## 19.1 Action mapping

### `REQUEST_DATA_CORRECTION`
Execution:
- do not requeue
- mark diagnosis executed after approval
- create audit event saying manual input correction is required

### `SCHEDULE_SAFE_RETRY`
Execution:
- only valid if target job still exists and is `dead_letter`
- clear last error fields
- clear lease
- set attempt_count = 0
- status = `queued`
- next_retry_at = now()
- enqueue no duplicate second job
- write audit event

### `REQUEST_REAUTH`
Execution:
- do not retry automatically
- create audit event and attention flag
- diagnosis becomes executed
- operator/admin must update provider configuration outside the app

### `ESCALATE_LOGIC_BUG`
Execution:
- no job mutation
- create high-severity audit event
- diagnosis becomes executed

### `NO_ACTION`
Execution:
- no job mutation
- diagnosis becomes executed
- audit the decision

## 19.2 Approval rules

- only admin may approve/reject
- decision is immutable
- second decision returns 409
- executor revalidates target state immediately before change
- action must exactly match persisted diagnosis
- every decision creates audit record

---

---

# 20. Daily Operations Report

The report is computed from persisted database data for a UTC day window.

Final metrics:
- events received
- events completed
- event replays
- event conflicts
- new clients
- business duplicate matches
- onboarding tasks created
- support tickets created
- urgent/high tickets
- AI ticket successes
- AI ticket fallbacks/errors
- jobs succeeded
- retries scheduled
- dead-letter jobs
- pending diagnosis proposals
- approved remediation decisions
- rejected remediation decisions
- top 5 error codes
- attention items

No LLM is used in the daily report. The MVP report is entirely deterministic and database-backed.

---

---

# 21. n8n Design — REQUIRED ARTIFACT, NOT SOURCE OF TRUTH

n8n runs locally in Docker.

## 21.1 Workflow 1: `Deal Won Orchestrator`

Nodes:
1. Webhook Trigger
2. Set/Normalize Demo Payload
3. HTTP Request to `/api/integrations/n8n/deal-won`
4. IF branch: event replay?
5. IF branch: business duplicate?
6. Set readable result summary
7. Respond to Webhook

The workflow does not:
- write Supabase tables
- implement retries for OpsPilot jobs
- generate IDs that replace backend IDs
- bypass backend validation

## 21.2 Workflow 2: `Daily Report Messenger`

Nodes:
1. Schedule Trigger
2. Set current UTC date
3. HTTP Request to `POST /api/integrations/n8n/daily-report` with `X-OpsPilot-N8N-Secret`
4. Format concise message
5. Telegram node
6. Success/error branch

For local demo, trigger it manually as well as with its schedule.

## 21.3 n8n repository requirements

Export both workflows to:
- `n8n/deal-won-orchestrator.json`
- `n8n/daily-report-messenger.json`

`n8n/README.md` must document:
- Docker startup
- required env/credentials
- how to import workflow JSON
- how to trigger each workflow
- statement that public OpsPilot demo does not depend on n8n being online

---

---

# 22. Demo Control Panel — FINAL

The dashboard must contain a clearly labeled **Demo Control Panel** with these exact scenarios:

1. **Send New Deal**
2. **Replay Same Event**
3. **Same Client, New Event ID**
4. **Create Normal Support Ticket**
5. **Create Ambiguous Support Ticket**
6. **Simulate Temporary Failure**
7. **Simulate Permanent Failure**
8. **Process Due Jobs**
9. **Diagnose Selected Dead-Letter Job**
10. **Approve Selected Diagnosis**
11. **Reject Selected Diagnosis**
12. **Generate Daily Report**
13. **Reset Synthetic Demo Data**

Each scenario:
- calls a real backend endpoint
- shows loading state
- shows success/error state
- displays correlation ID
- refreshes relevant tables
- never performs business logic only in the browser

`Reset Synthetic Demo Data` is admin-only and must delete only known synthetic demo rows using a server-side deterministic reset routine.

---

---

# 23. Dashboard Pages

## `/dashboard`
Show:
- KPI cards
- last workflow runs
- queue health
- dead-letter count
- latest tickets
- Demo Control Panel

## `/dashboard/clients`
Show:
- client
- external ID
- status
- created date
- task completion

## `/dashboard/tickets`
Show:
- subject
- category
- priority
- AI status
- review status
- summary
- suggested reply

## `/dashboard/jobs`
Show:
- type
- status
- attempts
- next retry
- lease expiry
- last error

## `/dashboard/failures`
Show:
- dead-letter jobs
- diagnosis
- recommendation
- confidence
- approval controls for admin

## `/dashboard/reports`
Show:
- selected date
- metrics
- failure breakdown
- attention items

---
