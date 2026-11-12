-- 004_rls.sql
-- Row Level Security policies + least-privilege grants (docs/database.md section 11).
--
-- Model: two independent layers, so a mistake in one does not expose data.
--   Layer 1 (privileges): anon gets NOTHING; authenticated gets SELECT only, and only
--                         on the tables the dashboard reads. No INSERT/UPDATE/DELETE/
--                         TRUNCATE/TRIGGER/REFERENCES for any browser role.
--   Layer 2 (RLS):        every table has RLS enabled (migration 002). Policies below
--                         allow SELECT only; there are NO write policies at all.
-- All business mutations go through server endpoints using the server-side secret key
-- (service_role), which bypasses RLS by design. Authorization stays server-enforced.

-- ---------------------------------------------------------------------------
-- 1. Least-privilege grants
-- ---------------------------------------------------------------------------

-- Supabase grants ALL on every public table to anon/authenticated by default.
revoke all on all tables in schema public from anon, authenticated;

-- Dashboard read access (docs/database.md 11.1) + profile self-read. Nothing else.
grant select on
  public.profiles,
  public.clients,
  public.onboarding_tasks,
  public.support_tickets,
  public.jobs,
  public.job_attempts,
  public.workflow_runs,
  public.audit_events
to authenticated;

-- Not browser-readable (server reads them via service_role after authorization):
--   processed_events, failure_diagnoses, approval_decisions.

-- Functions: nothing in public is callable by browser roles unless granted explicitly.
revoke execute on all functions in schema public from public, anon, authenticated;

-- Fail closed for FUTURE objects created by migrations (run as postgres): new tables
-- and functions are NOT exposed to browser roles until a migration grants them.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Policies (SELECT only, authenticated only)
-- ---------------------------------------------------------------------------

-- Profile self-read: a user can read ONLY their own row. Role changes are not
-- exposed to browsers (no write policy, no write privilege).
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- Dashboard reads: only provisioned app users (those with a profile row) may read
-- operational data. This also means a stray self-registered Supabase Auth account
-- without a profile sees nothing. The uncorrelated subquery is evaluated once per
-- statement, and it is itself subject to the profiles_select_own policy.
create policy clients_select_app_users
  on public.clients
  for select
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid())));

create policy onboarding_tasks_select_app_users
  on public.onboarding_tasks
  for select
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid())));

create policy support_tickets_select_app_users
  on public.support_tickets
  for select
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid())));

create policy jobs_select_app_users
  on public.jobs
  for select
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid())));

create policy job_attempts_select_app_users
  on public.job_attempts
  for select
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid())));

create policy workflow_runs_select_app_users
  on public.workflow_runs
  for select
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid())));

create policy audit_events_select_app_users
  on public.audit_events
  for select
  to authenticated
  using (exists (select 1 from public.profiles where id = (select auth.uid())));

-- Deliberately NO policies for INSERT / UPDATE / DELETE on any table, and none at all
-- for processed_events, failure_diagnoses, approval_decisions: RLS denies by default.
