-- V229 — Limite vitalício e atômico de 20 consultas NCM/NBS por visitante autenticado.
create table if not exists public.visitor_consultation_uses (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  consultation_type text not null check (consultation_type in ('ncm', 'nbs')),
  query_term text not null check (char_length(trim(query_term)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists visitor_consultation_uses_user_id_idx
  on public.visitor_consultation_uses(user_id);

alter table public.visitor_consultation_uses enable row level security;
revoke all on public.visitor_consultation_uses from anon, authenticated;

create or replace function public.visitor_consultation_status()
returns table (used integer, remaining integer, is_admin boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_admin boolean := false;
  v_used integer := 0;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if not exists(select 1 from public.profiles p where p.id=v_user and p.active=true and p.blocked_at is null) then
    raise exception 'ACCESS_BLOCKED';
  end if;
  select exists(
    select 1 from public.profiles p
    where p.id=v_user and p.role='admin_taxadvice' and p.active=true and p.blocked_at is null
  ) into v_admin;
  select count(*)::integer into v_used from public.visitor_consultation_uses u where u.user_id=v_user;
  return query select v_used, greatest(20-v_used,0), v_admin;
end;
$$;

create or replace function public.consume_visitor_consultation(p_type text, p_query_term text)
returns table (allowed boolean, used integer, remaining integer, is_admin boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_admin boolean := false;
  v_used integer := 0;
begin
  if v_user is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_type not in ('ncm','nbs') or char_length(trim(coalesce(p_query_term,'')))=0 then
    raise exception 'INVALID_CONSULTATION';
  end if;

  if not exists(select 1 from public.profiles p where p.id=v_user and p.active=true and p.blocked_at is null) then
    raise exception 'ACCESS_BLOCKED';
  end if;
  select exists(
    select 1 from public.profiles p
    where p.id=v_user and p.role='admin_taxadvice' and p.active=true and p.blocked_at is null
  ) into v_admin;
  if v_admin then
    return query select true, 0, 20, true;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user::text));
  select count(*)::integer into v_used from public.visitor_consultation_uses u where u.user_id=v_user;
  if v_used >= 20 then
    return query select false, v_used, 0, false;
    return;
  end if;

  insert into public.visitor_consultation_uses(user_id, consultation_type, query_term)
  values (v_user, p_type, trim(p_query_term));
  v_used := v_used + 1;
  return query select true, v_used, greatest(20-v_used,0), false;
end;
$$;

revoke all on function public.visitor_consultation_status() from public;
revoke all on function public.consume_visitor_consultation(text,text) from public;
grant execute on function public.visitor_consultation_status() to authenticated;
grant execute on function public.consume_visitor_consultation(text,text) to authenticated;
