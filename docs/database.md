# OpsPilot AI — Database, Invariants & RLS

**Single source of truth for schema, database constraints, indexes, and RLS.**

# 9. Database Schema — FINAL

Use UUID primary keys generated with `gen_random_uuid()` unless the row's natural identifier is explicitly the primary key.

All operational timestamps are `timestamptz`.

## 9.1 `clients`

Purpose: canonical business client record.

Fields:
- `id uuid primary key`
- `external_client_id text not null`
- `name text not null`
- `email text not null`
- `normalized_email text not null`
- `company text null`
- `status text not null default 'onboarding'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:
- unique `external_client_id`
- unique `normalized_email`
- status check: `onboarding | active | inactive`

Indexes:
- `external_client_id`
- `normalized_email`
- `created_at desc`

## 9.2 `processed_events`

Purpose: delivery-level idempotency.

Fields:
- `id uuid primary key`
- `event_id text not null unique`
- `event_type text not null`
- `schema_version integer not null`
- `payload_hash text not null`
- `status text not null`
- `client_id uuid null references clients(id)`
- `result_json jsonb null`
- `error_code text null`
- `created_at timestamptz not null default now()`
- `completed_at timestamptz null`

Status:
- `processing`
- `completed`
- `failed`

Rule:
If the same `event_id` is received again with a different `payload_hash`, return HTTP `409 EVENT_ID_PAYLOAD_MISMATCH`.

## 9.3 `workflow_runs`

Purpose: top-level trace for onboarding, ticket, report, and remediation workflows.

Fields:
- `id uuid primary key`
- `run_type text not null`
- `status text not null`
- `correlation_id text not null`
- `source text not null`
- `entity_type text null`
- `entity_id uuid null`
- `error_code text null`
- `error_message text null`
- `started_at timestamptz not null default now()`
- `completed_at timestamptz null`

Run types:
- `deal_won`
- `ticket_triage`
- `remediation`
- `daily_report`

Statuses:
- `running`
- `succeeded`
- `failed`

Index:
- `(run_type, started_at desc)`
- `correlation_id`

## 9.4 `onboarding_tasks`

Fields:
- `id uuid primary key`
- `client_id uuid not null references clients(id)`
- `task_key text not null`
- `title text not null`
- `status text not null default 'pending'`
- `created_at timestamptz not null default now()`
- `completed_at timestamptz null`

Unique:
- `(client_id, task_key)`

Final starter task keys:
1. `collect_brand_assets`
2. `confirm_primary_contacts`
3. `configure_reporting`
4. `schedule_kickoff`

Status:
- `pending`
- `completed`

## 9.5 `support_tickets`

Fields:
- `id uuid primary key`
- `external_ticket_id text null`
- `client_id uuid null references clients(id)`
- `subject text not null`
- `body text not null`
- `category text not null`
- `priority text not null`
- `rule_reason text not null`
- `ai_status text not null default 'not_requested'`
- `ai_summary text null`
- `ai_suggested_reply text null`
- `ai_confidence numeric null`
- `review_status text not null default 'requires_review'`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Category:
- `billing`
- `access`
- `technical`
- `general`

Priority:
- `low`
- `medium`
- `high`
- `urgent`

AI status:
- `not_requested`
- `succeeded`
- `fallback`
- `invalid_output`
- `provider_error`

Review:
- `requires_review`
- `approved`
- `rejected`

No AI-generated reply is ever sent automatically.

## 9.6 `jobs`

Purpose: durable async work queue.

Fields:
- `id uuid primary key`
- `job_type text not null`
- `payload jsonb not null`
- `status text not null default 'queued'`
- `attempt_count integer not null default 0`
- `max_attempts integer not null default 4`
- `next_retry_at timestamptz not null default now()`
- `lease_owner text null`
- `lease_expires_at timestamptz null`
- `last_error_code text null`
- `last_error_message text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`
- `completed_at timestamptz null`

Job types:
- `SEND_ONBOARDING_NOTIFICATION`
- `DEMO_TRANSIENT_FAILURE`
- `DEMO_PERMANENT_FAILURE`
- `EXECUTE_REMEDIATION`

Statuses:
- `queued`
- `processing`
- `retry_scheduled`
- `succeeded`
- `dead_letter`

Index:
- `(status, next_retry_at)`
- `lease_expires_at`

## 9.7 `job_attempts`

Fields:
- `id uuid primary key`
- `job_id uuid not null references jobs(id)`
- `attempt_number integer not null`
- `status text not null`
- `error_code text null`
- `error_message text null`
- `started_at timestamptz not null default now()`
- `completed_at timestamptz null`

Attempt status:
- `running`
- `succeeded`
- `failed`

Unique:
- `(job_id, attempt_number)`

## 9.8 `failure_diagnoses`

Fields:
- `id uuid primary key`
- `job_id uuid not null references jobs(id)`
- `status text not null default 'pending_approval'`
- `root_cause text not null`
- `reasoning_summary text not null`
- `recommended_action text not null`
- `confidence numeric not null`
- `expected_impact text not null`
- `rollback_plan text not null`
- `model_name text not null`
- `model_interaction_id text null`
- `created_by uuid not null references profiles(id)`
- `created_at timestamptz not null default now()`
- `executed_at timestamptz null`

Allowed recommended actions only:
- `REQUEST_DATA_CORRECTION`
- `SCHEDULE_SAFE_RETRY`
- `REQUEST_REAUTH`
- `ESCALATE_LOGIC_BUG`
- `NO_ACTION`

Status:
- `pending_approval`
- `approved`
- `rejected`
- `executed`
- `execution_failed`

## 9.9 `approval_decisions`

Fields:
- `id uuid primary key`
- `diagnosis_id uuid not null references failure_diagnoses(id)`
- `decision text not null`
- `comment text null`
- `decided_by uuid not null references profiles(id)`
- `decided_at timestamptz not null default now()`

Decision:
- `approved`
- `rejected`

Unique:
- `diagnosis_id`

This guarantees one final decision per diagnosis.

## 9.10 `audit_events`

Purpose: append-only-style business/security audit trail.

Fields:
- `id uuid primary key`
- `event_type text not null`
- `actor_type text not null`
- `actor_id text null`
- `entity_type text null`
- `entity_id text null`
- `correlation_id text null`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

Actor type:
- `user`
- `system`
- `cron`
- `n8n`

Audit events must never contain:
- API keys
- access tokens
- raw auth headers
- Telegram token
- full provider responses containing hidden metadata
- unsanitized secret-bearing payloads

---

---

# 10. Database Invariants

These are required at database level, not only application level.

1. `processed_events.event_id` unique.
2. `clients.external_client_id` unique.
3. `clients.normalized_email` unique.
4. `onboarding_tasks(client_id, task_key)` unique.
5. `job_attempts(job_id, attempt_number)` unique.
6. `approval_decisions.diagnosis_id` unique.
7. Foreign keys must prevent orphan workflow data.
8. All status values are constrained.
9. All user-facing tables have RLS enabled.
10. Critical worker functions are not callable by anonymous browser clients.
11. `updated_at` is maintained consistently.
12. No check-then-insert logic is accepted as the only duplicate guard.

---

---

# 11. RLS Contract

RLS is defense in depth, not a replacement for server authorization.

## 11.1 Browser-facing read policy

Authenticated users may read:
- clients
- onboarding_tasks
- support_tickets
- jobs
- job_attempts
- workflow_runs
- audit_events needed for dashboard display

## 11.2 Mutation policy

Normal browser clients do not directly mutate core business tables.

All business mutations go through authenticated Next.js server endpoints.

Admin-only operations:
- diagnosis creation
- approval decision
- remediation execution trigger

Worker operations use the server-side Supabase secret client.

## 11.3 Profile access

Users can read their own profile.
Role mutation is not exposed to normal users.

---
