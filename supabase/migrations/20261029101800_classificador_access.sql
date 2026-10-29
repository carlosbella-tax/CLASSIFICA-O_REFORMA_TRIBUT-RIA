-- V126 — Controle de acesso exclusivo do Classificador.
create type public.classificador_role as enum ('admin_taxadvice', 'usuario');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) > 1),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  organization_id uuid references public.organizations(id) on delete set null,
  role public.classificador_role not null default 'usuario',
  active boolean not null default true,
  valid_until date,
  blocked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standard_user_requires_expiration check (role = 'admin_taxadvice' or valid_until is not null)
);

create table public.access_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  subject_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role, active, valid_until)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), 'usuario', true, current_date)
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_taxadvice_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin_taxadvice' and active = true and blocked_at is null);
$$;

create or replace function public.classificador_access_status()
returns table (allowed boolean, role public.classificador_role, valid_until date, blocked boolean)
language sql stable security definer set search_path = public as $$
  select (p.active and p.blocked_at is null and (p.role = 'admin_taxadvice' or p.valid_until >= current_date)), p.role, p.valid_until, (not p.active or p.blocked_at is not null)
  from public.profiles p where p.id = auth.uid();
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.access_audit_events enable row level security;

create policy "profiles: own profile or administrator" on public.profiles for select to authenticated using (id = auth.uid() or public.is_taxadvice_admin());
create policy "profiles: administrators manage profiles" on public.profiles for all to authenticated using (public.is_taxadvice_admin()) with check (public.is_taxadvice_admin());
create policy "organizations: signed-in users read their organization" on public.organizations for select to authenticated using (id = (select organization_id from public.profiles where id = auth.uid()) or public.is_taxadvice_admin());
create policy "organizations: administrators manage" on public.organizations for all to authenticated using (public.is_taxadvice_admin()) with check (public.is_taxadvice_admin());
create policy "audit: administrators read" on public.access_audit_events for select to authenticated using (public.is_taxadvice_admin());

grant execute on function public.classificador_access_status() to authenticated;
grant execute on function public.is_taxadvice_admin() to authenticated;
