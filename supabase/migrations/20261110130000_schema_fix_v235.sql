-- Correção do schema V235 (sem blocos $$, evita erro de escape no SQL Editor)
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) > 1),
  created_at timestamptz not null default now()
);

create table if not exists public.access_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  subject_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists valid_from date;
alter table public.profiles add column if not exists valid_until date;
alter table public.profiles add column if not exists blocked_at timestamptz;
alter table public.profiles add column if not exists organization_id uuid references public.organizations(id) on delete set null;

create policy "profiles: own profile or administrator" on public.profiles for select to authenticated using (id = auth.uid() or public.is_taxadvice_admin());

create policy "profiles: administrators manage profiles" on public.profiles for all to authenticated using (public.is_taxadvice_admin()) with check (public.is_taxadvice_admin());

create policy "organizations: signed-in users read their organization" on public.organizations for select to authenticated using (id = (select organization_id from public.profiles where id = auth.uid()) or public.is_taxadvice_admin());

create policy "organizations: administrators manage" on public.organizations for all to authenticated using (public.is_taxadvice_admin()) with check (public.is_taxadvice_admin());

create policy "audit: administrators read" on public.access_audit_events for select to authenticated using (public.is_taxadvice_admin());

grant execute on function public.is_taxadvice_admin() to authenticated;
grant execute on function public.classificador_access_status() to authenticated;
