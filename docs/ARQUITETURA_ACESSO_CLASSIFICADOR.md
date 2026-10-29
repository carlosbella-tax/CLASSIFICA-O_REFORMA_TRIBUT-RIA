# Arquitetura de acesso — Classificador da Reforma Tributária

## Escopo e isolamento

A autenticação, banco e publicação serão criados em projetos exclusivos do **Classificador**. Nenhuma URL, chave, tabela ou função será compartilhada com o Motor de Cálculo.

## Papéis e acesso

| Papel | Acesso | Validade |
|---|---|---|
| Admin TaxAdvice | Classificador e área administrativa | Sem expiração por padrão |
| Usuário | Classificador | Obrigatória; bloqueado após a data |

Um usuário bloqueado não acessa o Classificador, independentemente da validade. Toda alteração administrativa gera evento de auditoria.

## Proteções

- RLS ativo em todas as tabelas públicas.
- O navegador usará somente `SUPABASE_URL` e chave anônima.
- A chave `SUPABASE_SERVICE_ROLE_KEY` ficará exclusivamente nos segredos das Edge Functions.
- Convites, mudança de papel e bloqueio serão executados pela Edge Function `admin-users`, após validar o administrador autenticado.
- O cliente consultará `classificador_access_status()` antes de abrir a aplicação.

## Provisionamento pendente de MFA

Após liberar a MFA, executar nesta ordem:

1. Criar o projeto Supabase exclusivo e registrar apenas as variáveis públicas no projeto Vercel.
2. Vincular o CLI ao projeto e aplicar a migração de acesso.
3. Configurar `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` somente nos segredos da Edge Function.
4. Promover a conta proprietária inicial a `admin_taxadvice` por operação autenticada e auditada.
5. Publicar `admin-users` e validar convite, expiração, bloqueio, reativação e RLS.
6. Criar o projeto Vercel exclusivo, inserir apenas URL e anon key públicas e publicar a aplicação.
