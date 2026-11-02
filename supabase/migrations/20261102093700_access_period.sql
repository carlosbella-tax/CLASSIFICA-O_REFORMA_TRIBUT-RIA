-- V177 — Período de acesso explícito para contas de usuário do Classificador.
alter table public.profiles
  add column if not exists valid_from date;

-- Registros legados permanecem utilizáveis desde a criação do perfil.
update public.profiles
set valid_from = created_at::date
where role = 'usuario' and valid_from is null;

alter table public.profiles
  alter column valid_from set default current_date;

alter table public.profiles
  drop constraint if exists standard_user_requires_expiration;

alter table public.profiles
  add constraint standard_user_requires_access_period
  check (
    role = 'admin_taxadvice'
    or (valid_from is not null and valid_until is not null and valid_from <= valid_until)
  );

create or replace function public.classificador_access_status()
returns table (allowed boolean, role public.classificador_role, valid_from date, valid_until date, blocked boolean)
language sql stable security definer set search_path = public as $$
  select (
    p.active
    and p.blocked_at is null
    and (
      p.role = 'admin_taxadvice'
      or (p.valid_from <= current_date and p.valid_until >= current_date)
    )
  ), p.role, p.valid_from, p.valid_until, (not p.active or p.blocked_at is not null)
  from public.profiles p where p.id = auth.uid();
$$;

grant execute on function public.classificador_access_status() to authenticated;
