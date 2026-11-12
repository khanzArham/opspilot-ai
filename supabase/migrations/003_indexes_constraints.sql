-- 003_indexes_constraints.sql
-- Database-level uniqueness (final race-condition guard) and query indexes.
-- Invariants from docs/database.md section 10. Named constraints so violations
-- are easy to identify in error messages and tests.

-- ---------------------------------------------------------------------------
-- Uniqueness (these must hold even if application code is bypassed)
-- ---------------------------------------------------------------------------

-- 1. Delivery-level idempotency: one row per event id.
alter table public.processed_events
  add constraint processed_events_event_id_key unique (event_id);

-- 2. One canonical client per external client id.
alter table public.clients
  add constraint clients_external_client_id_key unique (external_client_id);

-- 3. One canonical client per normalized email.
alter table public.clients
  add constraint clients_normalized_email_key unique (normalized_email);

-- 4. Each onboarding task key exists once per client.
alter table public.onboarding_tasks
  add constraint onboarding_tasks_client_id_task_key_key unique (client_id, task_key);

-- 5. Attempt numbers are unique per job.
alter table public.job_attempts
  add constraint job_attempts_job_id_attempt_number_key unique (job_id, attempt_number);

-- 6. Exactly one final decision per diagnosis.
alter table public.approval_decisions
  add constraint approval_decisions_diagnosis_id_key unique (diagnosis_id);

-- ---------------------------------------------------------------------------
-- Indexes
-- The unique constraints above already create indexes for:
--   processed_events(event_id), clients(external_client_id), clients(normalized_email),
--   onboarding_tasks(client_id, task_key), job_attempts(job_id, attempt_number),
--   approval_decisions(diagnosis_id).
-- ---------------------------------------------------------------------------

-- clients: newest first
create index clients_created_at_idx on public.clients (created_at desc);

-- processed_events: FK lookup + recent activity
create index processed_events_client_id_idx on public.processed_events (client_id);
create index processed_events_created_at_idx on public.processed_events (created_at desc);

-- workflow_runs
create index workflow_runs_run_type_started_at_idx
  on public.workflow_runs (run_type, started_at desc);
create index workflow_runs_correlation_id_idx on public.workflow_runs (correlation_id);

-- support_tickets
create index support_tickets_client_id_idx on public.support_tickets (client_id);
create index support_tickets_created_by_idx on public.support_tickets (created_by);
create index support_tickets_created_at_idx on public.support_tickets (created_at desc);

-- jobs: queue claim path and lease reclamation
create index jobs_status_next_retry_at_idx on public.jobs (status, next_retry_at);
create index jobs_lease_expires_at_idx on public.jobs (lease_expires_at);

-- failure_diagnoses: FK lookups + admin queue
create index failure_diagnoses_job_id_idx on public.failure_diagnoses (job_id);
create index failure_diagnoses_created_by_idx on public.failure_diagnoses (created_by);
create index failure_diagnoses_status_idx on public.failure_diagnoses (status);

-- approval_decisions: FK lookup
create index approval_decisions_decided_by_idx on public.approval_decisions (decided_by);

-- audit_events: timeline + entity drill-down
create index audit_events_created_at_idx on public.audit_events (created_at desc);
create index audit_events_entity_idx on public.audit_events (entity_type, entity_id);
