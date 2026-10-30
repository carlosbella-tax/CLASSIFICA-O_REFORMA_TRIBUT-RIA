-- V139 — Cadastro e limite persistente de consultas gratuitas NCM/NBS.
create table public.free_consultants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) > 1),
  cnpj text not null check (cnpj ~ '^[0-9]{14}$'),
  email text not null check (position('@' in email) > 1),
  phone text not null check (char_length(regexp_replace(phone, '\D', '', 'g')) between 10 and 13),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cnpj, email)
);

create table public.free_consultation_uses (
  id bigint generated always as identity primary key,
  consultant_id uuid not null references public.free_consultants(id) on delete cascade,
  consultation_type text not null check (consultation_type in ('ncm', 'nbs')),
  query_term text not null check (char_length(trim(query_term)) > 0),
  created_at timestamptz not null default now(),
  unique (consultant_id, consultation_type)
);

alter table public.free_consultants enable row level security;
alter table public.free_consultation_uses enable row level security;

create or replace function public.register_free_consultant(
  p_full_name text, p_cnpj text, p_email text, p_phone text
) returns table (consultant_id uuid, can_consult_ncm boolean, can_consult_nbs boolean)
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into public.free_consultants(full_name, cnpj, email, phone)
  values (trim(p_full_name), regexp_replace(p_cnpj, '\D', '', 'g'), lower(trim(p_email)), trim(p_phone))
  on conflict (cnpj, email) do update set
    full_name = excluded.full_name, phone = excluded.phone, updated_at = now()
  returning id into v_id;

  -- V139 — Qualifica as colunas para evitar ambiguidade com os campos retornados pela função.
  return query select v_id,
    not exists(select 1 from public.free_consultation_uses as u where u.consultant_id=v_id and u.consultation_type='ncm'),
    not exists(select 1 from public.free_consultation_uses as u where u.consultant_id=v_id and u.consultation_type='nbs');
end;
$$;

create or replace function public.consume_free_consultation(
  p_consultant_id uuid, p_type text, p_query_term text
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_type not in ('ncm', 'nbs') or char_length(trim(p_query_term))=0 then return false; end if;
  insert into public.free_consultation_uses(consultant_id, consultation_type, query_term)
  values (p_consultant_id, p_type, trim(p_query_term));
  return true;
exception when unique_violation then return false;
end;
$$;

revoke all on public.free_consultants, public.free_consultation_uses from anon, authenticated;
revoke all on function public.register_free_consultant(text,text,text,text) from public;
revoke all on function public.consume_free_consultation(uuid,text,text) from public;
