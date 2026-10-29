// V126 — Operações administrativas; a chave service-role permanece apenas no servidor.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const url = Deno.env.get('SUPABASE_URL')!;
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

async function requireAdmin(req: Request) {
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return null;
  const { data: profile } = await admin.from('profiles').select('role,active,blocked_at').eq('id', user.id).maybeSingle();
  return profile?.role === 'admin_taxadvice' && profile.active && !profile.blocked_at ? user : null;
}

Deno.serve(async req => {
  const actor = await requireAdmin(req);
  if (!actor) return json({ error: 'Não autorizado.' }, 403);
  const body = await req.json();

  if (body.action === 'list') {
    const [{ data: profiles, error }, { data: users, error: usersError }] = await Promise.all([
      admin.from('profiles').select('id,full_name,role,active,valid_until,blocked_at,organizations(name)').order('created_at'),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    ]);
    if (error || usersError) return json({ error: error?.message ?? usersError?.message }, 400);
    const emailById = new Map(users.users.map(user => [user.id, user.email]));
    return json({ users: profiles.map(profile => ({ ...profile, email: emailById.get(profile.id) ?? null })) });
  }

  if (body.action === 'invite') {
    const { email, full_name, role = 'usuario', organization_id = null, valid_until = null } = body;
    if (!email || !['admin_taxadvice', 'usuario'].includes(role) || (role === 'usuario' && !valid_until)) return json({ error: 'Dados de convite inválidos.' }, 400);
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { data: { full_name }, redirectTo: body.redirect_to });
    if (error || !data.user) return json({ error: error?.message ?? 'Convite não criado.' }, 400);
    await admin.from('profiles').update({ full_name, role, organization_id, valid_until: role === 'admin_taxadvice' ? null : valid_until, active: true, blocked_at: null }).eq('id', data.user.id);
    await admin.from('access_audit_events').insert({ actor_id: actor.id, subject_id: data.user.id, action: 'invite_sent', details: { role, valid_until } });
    return json({ user_id: data.user.id });
  }

  if (body.action === 'regenerate_invite_link') {
    if (!body.email) return json({ error: 'E-mail obrigatório.' }, 400);
    const { data, error } = await admin.auth.admin.generateLink({ type: 'invite', email: body.email, options: { redirectTo: body.redirect_to } });
    if (error) return json({ error: error.message }, 400);
    await admin.from('access_audit_events').insert({ actor_id: actor.id, subject_id: body.user_id ?? null, action: 'invite_link_regenerated', details: { email: body.email } });
    return json({ action_link: data.properties.action_link });
  }

  if (body.action === 'update') {
    const { user_id, full_name, role, organization_id, valid_until, active } = body;
    if (!user_id || !['admin_taxadvice', 'usuario'].includes(role) || (role === 'usuario' && !valid_until)) return json({ error: 'Dados de atualização inválidos.' }, 400);
    const patch = { full_name, role, organization_id: organization_id ?? null, valid_until: role === 'admin_taxadvice' ? null : valid_until, active: Boolean(active), blocked_at: active ? null : new Date().toISOString() };
    const { error } = await admin.from('profiles').update(patch).eq('id', user_id);
    if (error) return json({ error: error.message }, 400);
    await admin.from('access_audit_events').insert({ actor_id: actor.id, subject_id: user_id, action: patch.active ? 'user_updated' : 'user_blocked', details: patch });
    return json({ ok: true });
  }
  return json({ error: 'Ação inválida.' }, 400);
});
