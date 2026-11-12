-- 002_core_schema.sql
-- Core tables for OpsPilot AI (docs/database.md section 9).
--
-- Conventions:
--   * UUID primary keys via gen_random_uuid() unless the natural key is the PK.
--   * All operational timestamps are timestamptz.
--   * Status-like fields are text + named CHECK constraints (easy to inspect/change).
--   * Foreign keys have NO cascade except profiles -> auth.users, so workflow data
--     can never be orphaned or silently deleted.
--   * Uniqueness constraints and query indexes live in 003_indexes_constraints.sql.
--   * RLS is enabled on every table with NO policies (deny-all for anon/authenticated).
--     The server-side secret key bypasses RLS. Read policies come in a later step;
--     failing closed here avoids exposing tables through the public API in the meantime.

-- ---------------------------------------------------------------------------
-- updated_at maintenance (invariant 11)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 9.0 profiles (architecture section 8.4)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  display_name text not null,
  role         text not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'operator'))
);

-- ---------------------------------------------------------------------------
-- 9.1 clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id                 uuid primary key default gen_random_uuid(),
  external_client_id text not null,
  name               text not null,
  email              text not null,
  normalized_email   text not null,
  company            text,
  status             text not null default 'onboarding',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint clients_status_check check (status in ('onboarding', 'active', 'inactive'))
);

-- ---------------------------------------------------------------------------
-- 9.2 processed_events (delivery-level idempotency)
-- ---------------------------------------------------------------------------
create table public.processed_events (
  id             uuid primary key default gen_random_uuid(),
  event_id       text not null,
  event_type     text not null,
  schema_version integer not null,
  payload_hash   text not null,
  status         text not null,
  client_id      uuid references public.clients (id),
  result_json    jsonb,
  error_code     text,
  created_at     timestamptz not null default now(),
  completed_at   timestamptz,
  constraint processed_events_status_check
    check (status in ('processing', 'completed', 'failed'))
);

-- ---------------------------------------------------------------------------
-- 9.3 workflow_runs
-- ---------------------------------------------------------------------------
create table public.workflow_runs (
  id             uuid primary key default gen_random_uuid(),
  run_type       text not null,
  status         text not null,
  correlation_id text not null,
  source         text not null,
  entity_type    text,
  entity_id      uuid,
  error_code     text,
  error_message  text,
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  constraint workflow_runs_run_type_check
    check (run_type in ('deal_won', 'ticket_triage', 'remediation', 'daily_report')),
  constraint workflow_runs_status_check
    check (status in ('running', 'succeeded', 'failed'))
);

-- ---------------------------------------------------------------------------
-- 9.4 onboarding_tasks
-- ---------------------------------------------------------------------------
create table public.onboarding_tasks (
  id           uuid primary key default gen_random_uuid(),
  client_id    uuid not null references public.clients (id),
  task_key     text not null,
  title        text not null,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  completed_at timestamptz,
  constraint onboarding_tasks_status_check check (status in ('pending', 'completed'))
);

-- ---------------------------------------------------------------------------
-- 9.5 support_tickets
-- ---------------------------------------------------------------------------
create table public.support_tickets (
  id                  uuid primary key default gen_random_uuid(),
  external_ticket_id  text,
  client_id           uuid references public.clients (id),
  subject             text not null,
  body                text not null,
  category            text not null,
  priority            text not null,
  rule_reason         text not null,
  ai_status           text not null default 'not_requested',
  ai_summary          text,
  ai_suggested_reply  text,
  ai_confidence       numeric,
  review_status       text not null default 'requires_review',
  created_by          uuid not null references public.profiles (id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint support_tickets_category_check
    check (category in ('billing', 'access', 'technical', 'general')),
  constraint support_tickets_priority_check
    check (priority in ('low', 'medium', 'high', 'urgent')),
  constraint support_tickets_ai_status_check
    check (ai_status in ('not_requested', 'succeeded', 'fallback', 'invalid_output', 'provider_error')),
  constraint support_tickets_review_status_check
    check (review_status in ('requires_review', 'approved', 'rejected')),
  -- AI output is untrusted: keep confidence a sane probability even if app code is bypassed.
  constraint support_tickets_ai_confidence_check
    check (ai_confidence is null or (ai_confidence >= 0 and ai_confidence <= 1))
);

-- ---------------------------------------------------------------------------
-- 9.6 jobs (durable async work queue)
-- ---------------------------------------------------------------------------
create table public.jobs (
  id                 uuid primary key default gen_random_uuid(),
  job_type           text not null,
  payload            jsonb not null,
  status             text not null default 'queued',
  attempt_count      integer not null default 0,
  max_attempts       integer not null default 4,
  next_retry_at      timestamptz not null default now(),
  lease_owner        text,
  lease_expires_at   timestamptz,
  last_error_code    text,
  last_error_message text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  completed_at       timestamptz,
  constraint jobs_job_type_check
    check (job_type in (
      'SEND_ONBOARDING_NOTIFICATION',
      'DEMO_TRANSIENT_FAILURE',
      'DEMO_PERMANENT_FAILURE',
      'EXECUTE_REMEDIATION'
    )),
  constraint jobs_status_check
    check (status in ('queued', 'processing', 'retry_scheduled', 'succeeded', 'dead_letter')),
  constraint jobs_attempt_count_check check (attempt_count >= 0),
  constraint jobs_max_attempts_check check (max_attempts > 0)
);

-- ---------------------------------------------------------------------------
-- 9.7 job_attempts
-- ---------------------------------------------------------------------------
create table public.job_attempts (
  id             uuid primary key default gen_random_uuid(),
  job_id         uuid not null references public.jobs (id),
  attempt_number integer not null,
  status         text not null,
  error_code     text,
  error_message  text,
  started_at     timestamptz not null default now(),
  completed_at   timestamptz,
  constraint job_attempts_status_check
    check (status in ('running', 'succeeded', 'failed')),
  constraint job_attempts_attempt_number_check check (attempt_number > 0)
);

-- ---------------------------------------------------------------------------
-- 9.8 failure_diagnoses
-- ---------------------------------------------------------------------------
create table public.failure_diagnoses (
  id                   uuid primary key default gen_random_uuid(),
  job_id               uuid not null references public.jobs (id),
  status               text not null default 'pending_approval',
  root_cause           text not null,
  reasoning_summary    text not null,
  recommended_action   text not null,
  confidence           numeric not null,
  expected_impact      text not null,
  rollback_plan        text not null,
  model_name           text not null,
  model_interaction_id text,
  created_by           uuid not null references public.profiles (id),
  created_at           timestamptz not null default now(),
  executed_at          timestamptz,
  constraint failure_diagnoses_status_check
    check (status in ('pending_approval', 'approved', 'rejected', 'executed', 'execution_failed')),
  -- The five allowed actions only. No model-generated command can be stored.
  constraint failure_diagnoses_recommended_action_check
    check (recommended_action in (
      'REQUEST_DATA_CORRECTION',
      'SCHEDULE_SAFE_RETRY',
      'REQUEST_REAUTH',
      'ESCALATE_LOGIC_BUG',
      'NO_ACTION'
    )),
  constraint failure_diagnoses_confidence_check
    check (confidence >= 0 and confidence <= 1)
);

-- ---------------------------------------------------------------------------
-- 9.9 approval_decisions
-- ---------------------------------------------------------------------------
create table public.approval_decisions (
  id           uuid primary key default gen_random_uuid(),
  diagnosis_id uuid not null references public.failure_diagnoses (id),
  decision     text not null,
  comment      text,
  decided_by   uuid not null references public.profiles (id),
  decided_at   timestamptz not null default now(),
  constraint approval_decisions_decision_check check (decision in ('approved', 'rejected'))
);

-- ---------------------------------------------------------------------------
-- 9.10 audit_events (append-only-style trail; never store secrets in metadata)
-- ---------------------------------------------------------------------------
create table public.audit_events (
  id             uuid primary key default gen_random_uuid(),
  event_type     text not null,
  actor_type     text not null,
  actor_id       text,
  entity_type    text,
  entity_id      text,
  correlation_id text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  constraint audit_events_actor_type_check
    check (actor_type in ('user', 'system', 'cron', 'n8n'))
);

-- ---------------------------------------------------------------------------
-- updated_at triggers (tables that carry updated_at)
-- ---------------------------------------------------------------------------
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_updated_at();

create trigger jobs_set_updated_at
  before update on public.jobs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Fail closed: RLS on, no policies yet (invariant 9).
-- ---------------------------------------------------------------------------
alter table public.profiles           enable row level security;
alter table public.clients            enable row level security;
alter table public.processed_events   enable row level security;
alter table public.workflow_runs      enable row level security;
alter table public.onboarding_tasks   enable row level security;
alter table public.support_tickets    enable row level security;
alter table public.jobs               enable row level security;
alter table public.job_attempts       enable row level security;
alter table public.failure_diagnoses  enable row level security;
alter table public.approval_decisions enable row level security;
alter table public.audit_events       enable row level security;
