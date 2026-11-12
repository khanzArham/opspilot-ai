-- seed.sql
-- Deterministic, FICTIONAL demo data for GrowthFlow Media. Synthetic `.example`
-- emails only. No passwords, tokens or real people. Idempotent: safe to re-run.

-- ---------------------------------------------------------------------------
-- Profiles
-- Passwords never live in this file. Create two Supabase Auth users first
-- (dashboard -> Authentication -> Users, or admin API) with exactly these emails:
--     admin@growthflow.example
--     operator@growthflow.example
-- Then run this seed. Profile rows are derived from those auth.users rows, so if
-- the accounts do not exist yet this statement inserts nothing.
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, display_name, role)
select
  u.id,
  u.email,
  case u.email
    when 'admin@growthflow.example' then 'Demo Admin'
    else 'Demo Operator'
  end,
  case u.email
    when 'admin@growthflow.example' then 'admin'
    else 'operator'
  end
from auth.users u
where u.email in ('admin@growthflow.example', 'operator@growthflow.example')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Existing fictional clients (used to demo business-level duplicate handling).
-- Deliberately different from the live demo-scenario payloads so "Send New Deal"
-- still creates a fresh client.
-- ---------------------------------------------------------------------------
insert into public.clients
  (id, external_client_id, name, email, normalized_email, company, status)
values
  ('00000000-0000-4000-8000-0000000000a1', 'seed-crm-0001', 'Harbor & Pine Studio',
   'Contact@HarborPine.example', 'contact@harborpine.example', 'Harbor & Pine Studio', 'active'),
  ('00000000-0000-4000-8000-0000000000a2', 'seed-crm-0002', 'Brightwave Labs',
   'hello@brightwave.example', 'hello@brightwave.example', 'Brightwave Labs', 'onboarding')
on conflict (id) do nothing;

-- Onboarding tasks for the seeded clients (four starter keys each).
insert into public.onboarding_tasks (client_id, task_key, title, status, completed_at)
select c.id, t.task_key, t.title,
       case when c.status = 'active' then 'completed' else 'pending' end,
       case when c.status = 'active' then now() else null end
from public.clients c
cross join (values
  ('collect_brand_assets',     'Collect brand assets'),
  ('confirm_primary_contacts', 'Confirm primary contacts'),
  ('configure_reporting',      'Configure reporting'),
  ('schedule_kickoff',         'Schedule kickoff call')
) as t(task_key, title)
where c.id in (
  '00000000-0000-4000-8000-0000000000a1',
  '00000000-0000-4000-8000-0000000000a2'
)
on conflict (client_id, task_key) do nothing;
