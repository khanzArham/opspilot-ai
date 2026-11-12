-- Day 3 Step 4 RLS / privilege verification.
-- Simulates PostgREST requests by switching to the anon / authenticated role and setting
-- JWT claims, then ends with a deliberate RAISE EXCEPTION so EVERYTHING (including the
-- temporary grants used in phase 2) is rolled back. No residue, no persistent change.
-- Run:  npx supabase db query --remote --yes -f supabase/verification/rls.sql
-- Expected: error text "ROLLED_BACK_OK  CHECKS=34  FAILS=0" (failing lines, if any, follow).
-- The CLI truncates error text at ~1000 chars, so only failures are printed by default.
-- To print passing lines too, set show_from/show_to below (e.g. 1..12, 13..24, 25..34).
-- Requires the two seeded profiles (admin@/operator@growthflow.example).

create function pg_temp.as_role(r text, sub uuid, stmt text)
returns text language plpgsql as $f$
declare n bigint; res text;
begin
  perform set_config('request.jwt.claims',
    case when sub is null then '' else json_build_object('sub', sub, 'role', r)::text end, true);
  execute format('set local role %I', r);
  begin
    execute stmt;
    get diagnostics n = row_count;
    res := 'OK rows=' || n;
  exception when others then
    res := 'ERR ' || sqlstate || case when sqlerrm like '%row-level security%' then ' (rls)' else '' end;
  end;
  reset role;
  return res;
end $f$;

create function pg_temp.chk(label text, got text, expected text)
returns text language sql as $f$
  select case when got like expected then 'PASS ' else 'FAIL ' end
         || label || ' -> ' || got;
$f$;

do $$
declare
  lines text[] := '{}';
  show_from int := 0;  -- set to print a slice of passing lines (1-based, inclusive)
  show_to   int := 0;
  fails int;
  failing text;
  shown text;
  admin_id uuid; op_id uuid; ghost_id uuid := gen_random_uuid();
  n_clients bigint; n_tasks bigint;
  ins text := $q$insert into public.clients (external_client_id,name,email,normalized_email)
                 values ('zz-rls','zz','zz@zz.example','zz@zz.example')$q$;
  role_after text;
begin
  select id into admin_id from public.profiles where email = 'admin@growthflow.example';
  select id into op_id    from public.profiles where email = 'operator@growthflow.example';
  if admin_id is null or op_id is null then
    raise exception 'seeded profiles missing; create the two Auth users and run seed.sql';
  end if;
  select count(*) into n_clients from public.clients;
  select count(*) into n_tasks   from public.onboarding_tasks;

  -- ===== PHASE 1: privileges + RLS as shipped =====
  -- anonymous
  lines := lines || pg_temp.chk('anon  SELECT clients',            pg_temp.as_role('anon', null, 'select 1 from public.clients'), 'ERR 42501%');
  lines := lines || pg_temp.chk('anon  SELECT profiles',           pg_temp.as_role('anon', null, 'select 1 from public.profiles'), 'ERR 42501%');
  lines := lines || pg_temp.chk('anon  INSERT clients',            pg_temp.as_role('anon', null, ins), 'ERR 42501%');

  -- authenticated operator
  lines := lines || pg_temp.chk('operator SELECT own profile row only',
        pg_temp.as_role('authenticated', op_id, 'select 1 from public.profiles'), 'OK rows=1');
  lines := lines || pg_temp.chk('operator role lookup (what requireUser runs) -> 1 row',
        pg_temp.as_role('authenticated', op_id, format($q$select 1 from public.profiles where id=%L and role='operator'$q$, op_id)), 'OK rows=1');
  lines := lines || pg_temp.chk('operator cannot read the admin profile',
        pg_temp.as_role('authenticated', op_id, format('select 1 from public.profiles where id=%L', admin_id)), 'OK rows=0');
  lines := lines || pg_temp.chk('operator SELECT clients (dashboard read)',
        pg_temp.as_role('authenticated', op_id, 'select 1 from public.clients'), 'OK rows=' || n_clients);
  lines := lines || pg_temp.chk('operator SELECT onboarding_tasks',
        pg_temp.as_role('authenticated', op_id, 'select 1 from public.onboarding_tasks'), 'OK rows=' || n_tasks);
  lines := lines || pg_temp.chk('operator SELECT processed_events (server-only)',
        pg_temp.as_role('authenticated', op_id, 'select 1 from public.processed_events'), 'ERR 42501%');
  lines := lines || pg_temp.chk('operator SELECT failure_diagnoses (server-only)',
        pg_temp.as_role('authenticated', op_id, 'select 1 from public.failure_diagnoses'), 'ERR 42501%');
  lines := lines || pg_temp.chk('operator SELECT approval_decisions (server-only)',
        pg_temp.as_role('authenticated', op_id, 'select 1 from public.approval_decisions'), 'ERR 42501%');
  lines := lines || pg_temp.chk('operator INSERT clients',         pg_temp.as_role('authenticated', op_id, ins), 'ERR 42501%');
  lines := lines || pg_temp.chk('operator UPDATE clients',         pg_temp.as_role('authenticated', op_id, $q$update public.clients set name='hacked'$q$), 'ERR 42501%');
  lines := lines || pg_temp.chk('operator DELETE clients',         pg_temp.as_role('authenticated', op_id, 'delete from public.clients'), 'ERR 42501%');
  lines := lines || pg_temp.chk('operator TRUNCATE clients',       pg_temp.as_role('authenticated', op_id, 'truncate public.clients'), 'ERR 42501%');
  lines := lines || pg_temp.chk('operator escalate own role to admin (UPDATE profiles)',
        pg_temp.as_role('authenticated', op_id, format($q$update public.profiles set role='admin' where id=%L$q$, op_id)), 'ERR 42501%');
  lines := lines || pg_temp.chk('operator INSERT job (browser cannot enqueue)',
        pg_temp.as_role('authenticated', op_id, $q$insert into public.jobs (job_type,payload) values ('DEMO_TRANSIENT_FAILURE','{}')$q$), 'ERR 42501%');

  -- authenticated admin (browser admin is still not allowed to mutate directly)
  lines := lines || pg_temp.chk('admin SELECT own profile row only',
        pg_temp.as_role('authenticated', admin_id, 'select 1 from public.profiles'), 'OK rows=1');
  lines := lines || pg_temp.chk('admin role lookup (what requireUser runs) -> 1 row',
        pg_temp.as_role('authenticated', admin_id, format($q$select 1 from public.profiles where id=%L and role='admin'$q$, admin_id)), 'OK rows=1');
  lines := lines || pg_temp.chk('admin SELECT clients (dashboard read)',
        pg_temp.as_role('authenticated', admin_id, 'select 1 from public.clients'), 'OK rows=' || n_clients);
  lines := lines || pg_temp.chk('admin SELECT failure_diagnoses (server-only)',
        pg_temp.as_role('authenticated', admin_id, 'select 1 from public.failure_diagnoses'), 'ERR 42501%');
  lines := lines || pg_temp.chk('admin INSERT clients (browser write)', pg_temp.as_role('authenticated', admin_id, ins), 'ERR 42501%');
  lines := lines || pg_temp.chk('admin UPDATE clients (browser write)', pg_temp.as_role('authenticated', admin_id, $q$update public.clients set name='x'$q$), 'ERR 42501%');
  lines := lines || pg_temp.chk('admin DELETE jobs (browser write)',    pg_temp.as_role('authenticated', admin_id, 'delete from public.jobs'), 'ERR 42501%');

  -- authenticated but NOT an app user (no profile row)
  lines := lines || pg_temp.chk('no-profile user sees 0 clients',
        pg_temp.as_role('authenticated', ghost_id, 'select 1 from public.clients'), 'OK rows=0');
  lines := lines || pg_temp.chk('no-profile user sees 0 profiles',
        pg_temp.as_role('authenticated', ghost_id, 'select 1 from public.profiles'), 'OK rows=0');

  -- ===== PHASE 2: prove RLS holds even if a privilege were granted by mistake =====
  grant insert, update, delete on public.clients, public.profiles, public.jobs to authenticated;
  grant select on public.clients to anon;

  lines := lines || pg_temp.chk('[RLS only] anon SELECT clients (privilege present)',
        pg_temp.as_role('anon', null, 'select 1 from public.clients'), 'OK rows=0');
  lines := lines || pg_temp.chk('[RLS only] operator INSERT clients blocked by policy',
        pg_temp.as_role('authenticated', op_id, ins), 'ERR 42501 (rls)');
  lines := lines || pg_temp.chk('[RLS only] operator INSERT job blocked by policy',
        pg_temp.as_role('authenticated', op_id, $q$insert into public.jobs (job_type,payload) values ('DEMO_TRANSIENT_FAILURE','{}')$q$), 'ERR 42501 (rls)');
  lines := lines || pg_temp.chk('[RLS only] operator UPDATE clients affects 0 rows',
        pg_temp.as_role('authenticated', op_id, $q$update public.clients set name='hacked'$q$), 'OK rows=0');
  lines := lines || pg_temp.chk('[RLS only] operator DELETE clients affects 0 rows',
        pg_temp.as_role('authenticated', op_id, 'delete from public.clients'), 'OK rows=0');
  lines := lines || pg_temp.chk('[RLS only] operator role-escalation UPDATE affects 0 rows',
        pg_temp.as_role('authenticated', op_id, format($q$update public.profiles set role='admin' where id=%L$q$, op_id)), 'OK rows=0');

  select role into role_after from public.profiles where id = op_id;
  lines := lines || pg_temp.chk('[RLS only] operator role unchanged afterwards', role_after, 'operator');
  lines := lines || pg_temp.chk('[RLS only] client rows unchanged afterwards',
        (select count(*)::text from public.clients), n_clients::text);

  select count(*), coalesce(string_agg(l, E'\n'), '')
    into fails, failing from unnest(lines) l where l like 'FAIL %';
  select coalesce(string_agg(l, E'\n' order by i), '')
    into shown from unnest(lines) with ordinality as t(l, i)
    where i between show_from and show_to;

  -- Abort on purpose so every grant and fixture above is rolled back.
  raise exception E'ROLLED_BACK_OK  CHECKS=%  FAILS=%\n%\n%',
    array_length(lines, 1), fails, failing, shown;
end
$$;
