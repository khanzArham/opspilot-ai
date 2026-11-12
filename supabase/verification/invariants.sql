-- Day 2 invariant verification. Attempts duplicates/violations directly in SQL and ends
-- with a deliberate RAISE EXCEPTION so every fixture is rolled back (no residue).
-- Run:  npx supabase db query --remote --yes -f supabase/verification/invariants.sql
-- Expected: an error message "ROLLED_BACK_OK" listing T1..T9 all REJECTED.

do $$
declare
  r text := '';
  uid uuid := '99999999-9999-4999-8999-999999999999';
  jid uuid := '99999999-9999-4999-8999-999999999998';
  did uuid := '99999999-9999-4999-8999-999999999997';
begin
  -- T1 duplicate event_id
  begin
    insert into public.processed_events (event_id, event_type, schema_version, payload_hash, status)
      values ('zz-test-evt-1', 'deal_won', 1, 'h1', 'processing');
    insert into public.processed_events (event_id, event_type, schema_version, payload_hash, status)
      values ('zz-test-evt-1', 'deal_won', 1, 'h2', 'processing');
    r := r || E'T1 event_id dup: NOT REJECTED\n';
  exception when unique_violation then r := r || E'T1 event_id dup: REJECTED (unique_violation)\n'; end;

  -- T2 duplicate external_client_id (different emails)
  begin
    insert into public.clients (external_client_id, name, email, normalized_email)
      values ('zz-ext-1', 'A', 'a1@zz.example', 'a1@zz.example');
    insert into public.clients (external_client_id, name, email, normalized_email)
      values ('zz-ext-1', 'B', 'a2@zz.example', 'a2@zz.example');
    r := r || E'T2 external_client_id dup: NOT REJECTED\n';
  exception when unique_violation then r := r || E'T2 external_client_id dup: REJECTED (unique_violation)\n'; end;

  -- T3 duplicate normalized_email (different external ids)
  begin
    insert into public.clients (external_client_id, name, email, normalized_email)
      values ('zz-ext-2', 'A', 'Same@zz.example', 'same@zz.example');
    insert into public.clients (external_client_id, name, email, normalized_email)
      values ('zz-ext-3', 'B', 'SAME@zz.example', 'same@zz.example');
    r := r || E'T3 normalized_email dup: NOT REJECTED\n';
  exception when unique_violation then r := r || E'T3 normalized_email dup: REJECTED (unique_violation)\n'; end;

  -- T4 duplicate onboarding task key for seeded client
  begin
    insert into public.onboarding_tasks (client_id, task_key, title)
      values ('00000000-0000-4000-8000-0000000000a1', 'schedule_kickoff', 'dup');
    r := r || E'T4 task key dup: NOT REJECTED\n';
  exception when unique_violation then r := r || E'T4 task key dup: REJECTED (unique_violation)\n'; end;

  -- Fixtures for T5/T6 (rolled back with everything else)
  insert into auth.users (id, email) values (uid, 'zz-inv@growthflow.example');
  insert into public.profiles (id, email, display_name, role)
    values (uid, 'zz-inv@growthflow.example', 'Inv', 'admin');
  insert into public.jobs (id, job_type, payload) values (jid, 'DEMO_PERMANENT_FAILURE', '{}'::jsonb);

  -- T5 duplicate (job_id, attempt_number)
  begin
    insert into public.job_attempts (job_id, attempt_number, status) values (jid, 1, 'running');
    insert into public.job_attempts (job_id, attempt_number, status) values (jid, 1, 'failed');
    r := r || E'T5 attempt number dup: NOT REJECTED\n';
  exception when unique_violation then r := r || E'T5 attempt number dup: REJECTED (unique_violation)\n'; end;

  -- T6 second decision for the same diagnosis
  insert into public.failure_diagnoses
    (id, job_id, root_cause, reasoning_summary, recommended_action, confidence,
     expected_impact, rollback_plan, model_name, created_by)
    values (did, jid, 'rc', 'rs', 'NO_ACTION', 0.5, 'ei', 'rp', 'test', uid);
  begin
    insert into public.approval_decisions (diagnosis_id, decision, decided_by) values (did, 'approved', uid);
    insert into public.approval_decisions (diagnosis_id, decision, decided_by) values (did, 'rejected', uid);
    r := r || E'T6 second decision: NOT REJECTED\n';
  exception when unique_violation then r := r || E'T6 second decision: REJECTED (unique_violation)\n'; end;

  -- T7 disallowed AI action cannot be stored
  begin
    insert into public.failure_diagnoses
      (job_id, root_cause, reasoning_summary, recommended_action, confidence,
       expected_impact, rollback_plan, model_name, created_by)
      values (jid, 'rc', 'rs', 'DROP TABLE clients', 0.5, 'ei', 'rp', 'test', uid);
    r := r || E'T7 bad AI action: NOT REJECTED\n';
  exception when check_violation then r := r || E'T7 bad AI action: REJECTED (check_violation)\n'; end;

  -- T8 invalid job status
  begin
    insert into public.jobs (job_type, payload, status) values ('DEMO_TRANSIENT_FAILURE', '{}'::jsonb, 'bogus');
    r := r || E'T8 bad job status: NOT REJECTED\n';
  exception when check_violation then r := r || E'T8 bad job status: REJECTED (check_violation)\n'; end;

  -- T9 orphan FK
  begin
    insert into public.onboarding_tasks (client_id, task_key, title)
      values ('11111111-1111-4111-8111-111111111111', 'collect_brand_assets', 'orphan');
    r := r || E'T9 orphan task: NOT REJECTED\n';
  exception when foreign_key_violation then r := r || E'T9 orphan task: REJECTED (foreign_key_violation)\n'; end;

  -- Abort on purpose so every fixture and test row is rolled back.
  raise exception E'ROLLED_BACK_OK\n%', r;
end
$$;
