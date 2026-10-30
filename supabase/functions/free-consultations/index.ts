// V139 — Cadastro público e controle server-side de uma consulta gratuita por tipo.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const headers = { 'content-type': 'application/json', 'access-control-allow-origin': 'https://classificador-reforma-tributaria.vercel.app', 'access-control-allow-headers': 'content-type', 'access-control-allow-methods': 'POST, OPTIONS' };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const emailOk = (v: unknown) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());

Deno.serve(async req => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);
  try {
    const body = await req.json();
    if (body.action === 'register') {
      const fullName = String(body.full_name || '').trim();
      const cnpj = String(body.cnpj || '').replace(/\D/g, '');
      const email = String(body.email || '').trim().toLowerCase();
      const phone = String(body.phone || '').replace(/\D/g, '');
      if (fullName.length < 2 || cnpj.length !== 14 || !emailOk(email) || phone.length < 10 || phone.length > 13) return json({ error: 'Informe nome, CNPJ, e-mail e telefone válidos.' }, 400);
      const { data, error } = await admin.rpc('register_free_consultant', { p_full_name: fullName, p_cnpj: cnpj, p_email: email, p_phone: phone });
      if (error || !data?.[0]) return json({ error: error?.message || 'Não foi possível registrar o cadastro.' }, 400);
      const item = data[0];
      return json({ consultant_id: item.consultant_id, quotas: { ncm: item.can_consult_ncm, nbs: item.can_consult_nbs } });
    }
    if (body.action === 'consume') {
      const consultantId = String(body.consultant_id || '');
      const type = String(body.type || '').toLowerCase();
      const term = String(body.term || '').trim();
      if (!consultantId || !['ncm', 'nbs'].includes(type) || !term) return json({ error: 'Consulta inválida.' }, 400);
      const { data, error } = await admin.rpc('consume_free_consultation', { p_consultant_id: consultantId, p_type: type, p_query_term: term });
      if (error) return json({ error: 'Não foi possível validar a disponibilidade da consulta.' }, 400);
      if (!data) return json({ error: 'Sua consulta gratuita de ' + type.toUpperCase() + ' já foi utilizada.' }, 429);
      return json({ ok: true });
    }
    return json({ error: 'Ação inválida.' }, 400);
  } catch (_) { return json({ error: 'Não foi possível concluir a solicitação.' }, 400); }
});
