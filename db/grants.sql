-- Supabase's anon/authenticated/service_role Postgres roles need explicit
-- table-level GRANTs before RLS policies are even consulted — RLS only
-- filters rows on an already-permitted operation. Supabase's dashboard/CLI
-- migrations set these up automatically; a direct connection (drizzle-kit
-- push) does not, so this has to be applied once per schema push by hand.
-- Safe to run multiple times, and safe to grant ALL here since RLS (see
-- db/schema.ts) is the actual access boundary per table/row.

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all routines in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on routines to anon, authenticated, service_role;
