-- 001_extensions.sql
-- Extensions required by OpsPilot AI. Idempotent: safe to re-run.
--
-- Status/enum-like fields are intentionally NOT created here. Per the Day 2 plan
-- they are text columns with CHECK constraints (see 002_core_schema.sql), which
-- keeps migrations easy to inspect and change.

-- Cryptographic helpers (gen_random_bytes, digest, hmac). Kept in the
-- `extensions` schema so it is not exposed through the public API schema.
create extension if not exists pgcrypto with schema extensions;

-- Scheduler: Supabase Cron runs the signed job-processing call.
create extension if not exists pg_cron with schema pg_catalog;

-- Asynchronous HTTP from Postgres, used by Cron to call the Next.js endpoint.
create extension if not exists pg_net with schema extensions;

-- Encrypted secret storage for database-side scheduling (cron signing secret).
-- Provided by Supabase; creates the `vault` schema.
create extension if not exists supabase_vault with schema vault;
