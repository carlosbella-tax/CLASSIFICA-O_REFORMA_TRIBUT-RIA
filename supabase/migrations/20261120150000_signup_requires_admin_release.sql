-- V257 — Cadastro feito pelo próprio usuário nasce pendente (inativo) e só passa a valer
-- depois que o administrador libera na aba Administração, com início e fim do acesso.
-- Convites do administrador continuam ativos: a função admin-users ativa o perfil logo após criar o convite.
-- Sem blocos de cifrão duplo, para colar direto no SQL Editor do Supabase.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as '
begin
  insert into public.profiles (id, full_name, role, active, valid_from, valid_until)
  values (new.id, coalesce(new.raw_user_meta_data ->> ''full_name'', ''''), ''usuario'', false, current_date, current_date)
  on conflict (id) do nothing;
  return new;
end;
';
