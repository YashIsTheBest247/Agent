-- Second Chair — durable record storage.
--
-- One table for every desk. The records are already self-describing JSON, so
-- a table per desk would buy nothing but migrations to keep in step.
--
-- Run this once in the Supabase SQL editor, then set SUPABASE_URL and
-- SUPABASE_SERVICE_ROLE_KEY in your environment.

create table if not exists public.records (
  namespace  text        not null,
  id         text        not null,
  created_at timestamptz not null default now(),
  data       jsonb       not null,
  primary key (namespace, id)
);

-- Every list query is "this namespace, newest first".
create index if not exists records_namespace_created_idx
  on public.records (namespace, created_at desc);

-- Ownership is enforced in the application, which is the only place that knows
-- who is signed in. RLS is enabled anyway so that a leaked anon key grants
-- nothing: the service-role key used by the server bypasses it, and no policy
-- is granted to anon or authenticated.
alter table public.records enable row level security;
