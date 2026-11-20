/* V257 — Regressão do cadastro com liberação do administrador: pendente não entra, liberado no período
   tem acesso completo, vencido não entra, e o administrador libera, altera o período ou bloqueia. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const fonte=fs.readFileSync(path.join(root,'src/js/modulos/119-v229-acesso-visitante-20-consultas.js'),'utf8');
const dom=new JSDOM('<html><head></head><body><aside id="v123-sidebar"><button class="v123-link" data-v123-key="consulta">Consulta</button><button class="v123-link" data-v123-key="ibs">Base</button><button class="v123-link" data-v123-key="dashboard">Dashboard</button><div class="v123-status"></div></aside><div id="v123-topbar"></div></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;
const hoje=(()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')})();
const dia=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
/* Supabase simulado: cada teste define o perfil devolvido pelo servidor. */
const srv={visitor:{data:[{used:0,remaining:20,is_admin:false}],error:null},acesso:{data:[{allowed:true,role:'usuario',valid_from:hoje,valid_until:dia(10),blocked:false}],error:null},saidas:0,chamadas:[],
 usuarios:[{id:'u-ativo',full_name:'Ana Ativa',email:'ana@x.com',role:'usuario',active:true,valid_from:dia(-5),valid_until:dia(20),blocked_at:null},
  {id:'u-pend',full_name:'Paulo <b>Pendente</b>',email:'paulo@x.com',role:'usuario',active:false,valid_from:hoje,valid_until:hoje,blocked_at:null},
  {id:'u-venc',full_name:'Vera Vencida',email:'vera@x.com',role:'usuario',active:true,valid_from:dia(-40),valid_until:dia(-1),blocked_at:null},
  {id:'u-bloq',full_name:'Bruno Bloqueado',email:'bruno@x.com',role:'usuario',active:false,valid_from:dia(-5),valid_until:dia(20),blocked_at:'2026-11-01T00:00:00Z'},
  {id:'u-adm',full_name:'Carlos',email:'carlos.bella@taxadvice.com.br',role:'admin_taxadvice',active:true,valid_from:null,valid_until:null,blocked_at:null}]};
w.CLASSIFICADOR_ENV={supabaseUrl:'https://teste.supabase.co',supabaseAnonKey:'chave'};
w.confirm=()=>true;
w.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:null}}),onAuthStateChange:()=>{},signOut:async()=>{srv.saidas++},
  signInWithPassword:async({email})=>({data:{user:{email,email_confirmed_at:'2026-11-01',user_metadata:{full_name:'Teste'}}},error:null}),
  signUp:async()=>({data:{session:null},error:null})},
 rpc:async nome=>nome==='visitor_consultation_status'?srv.visitor:nome==='classificador_access_status'?srv.acesso:{data:null,error:{message:'desconhecida'}},
 functions:{invoke:async(nome,{body})=>{srv.chamadas.push(body);if(body.action==='update'){const u=srv.usuarios.find(x=>x.id===body.user_id);Object.assign(u,{valid_from:body.valid_from,valid_until:body.valid_until,active:body.active,blocked_at:body.active?null:'2026-11-20T00:00:00Z'})}return {data:body.action==='list'?{users:srv.usuarios}:{ok:true},error:null}}}})};
w.eval(fonte);
const d=w.document;let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V257: '+nome)};
const espera=()=>new Promise(r=>setTimeout(r,30));
const entrar=async email=>{d.getElementById('v229-login-email').value=email;d.getElementById('v229-login-senha').value='senha1234';d.getElementById('v229-entrar').dispatchEvent(new w.Event('submit',{cancelable:true}));await espera()};
const travados=()=>[...d.querySelectorAll('#v123-sidebar .v123-link')].filter(m=>m.classList.contains('v229-locked')).map(m=>m.dataset.v123Key);
const msg=()=>d.getElementById('v229-message').textContent;
const V=w.classificadorV257;

await teste('situação do cadastro: pendente, ativo, vencido, agendado e bloqueado',()=>{const s=u=>V.situacao(u,hoje);const u=srv.usuarios;
 assert.equal(s(u[0]),'Ativo');assert.equal(s(u[1]),'Pendente');assert.equal(s(u[2]),'Vencido');assert.equal(s(u[3]),'Bloqueado');assert.equal(s(u[4]),'Ativo');
 assert.equal(s({role:'usuario',active:true,valid_from:dia(3),valid_until:dia(9),blocked_at:null}),'Agendado');assert.equal(V.dataBr('2026-11-20'),'20/11/2026')});
await teste('sem login: só a Consulta fica aberta',()=>{assert.deepEqual(travados(),['ibs','dashboard']);assert.equal(d.getElementById('v229-auth').hidden,false)});
await teste('cadastro próprio: mensagem avisa que depende da liberação do administrador',async()=>{d.getElementById('v229-nome').value='Novo Usuário';d.getElementById('v229-email').value='novo@x.com';d.getElementById('v229-senha').value='senha1234';
 d.getElementById('v229-cadastro').dispatchEvent(new w.Event('submit',{cancelable:true}));await espera();assert.match(msg(),/aguarde a liberação do administrador/)});
await teste('cadastro pendente (perfil inativo no servidor): não entra e a sessão é encerrada',async()=>{srv.visitor={data:null,error:{message:'ACCESS_BLOCKED'}};const antes=srv.saidas;await entrar('paulo@x.com');
 assert.equal(srv.saidas,antes+1);assert.match(msg(),/ainda não foi liberado pelo administrador/);assert.deepEqual(travados(),['ibs','dashboard']);assert.equal(d.getElementById('v229-auth').hidden,false)});
await teste('cadastro pendente pela consulta de acesso (blocked): não entra',async()=>{srv.visitor={data:[{used:0,remaining:20,is_admin:false}],error:null};srv.acesso={data:[{allowed:false,role:'usuario',valid_from:hoje,valid_until:hoje,blocked:true}],error:null};const antes=srv.saidas;await entrar('paulo@x.com');
 assert.equal(srv.saidas,antes+1);assert.match(msg(),/ainda não foi liberado/);assert.deepEqual(travados(),['ibs','dashboard'])});
await teste('período vencido: não entra e pede novo período',async()=>{srv.acesso={data:[{allowed:false,role:'usuario',valid_from:dia(-40),valid_until:dia(-1),blocked:false}],error:null};await entrar('vera@x.com');
 assert.match(msg(),/período de acesso não está vigente/);assert.deepEqual(travados(),['ibs','dashboard'])});
await teste('usuário liberado no período: acesso completo a todos os menus, sem botão Administração',async()=>{srv.acesso={data:[{allowed:true,role:'usuario',valid_from:hoje,valid_until:'2026-12-31',blocked:false}],error:null};await entrar('ana@x.com');
 assert.deepEqual(travados(),[]);assert.equal(d.getElementById('v229-auth').hidden,true);assert.match(d.getElementById('v229-counter').textContent,/Acesso completo/);assert.match(d.getElementById('v229-counter').textContent,/31\/12\/2026/);assert.equal(d.getElementById('v235-admin-link'),null)});
await teste('sair volta ao estado sem login',async()=>{d.getElementById('v229-logout').click();await espera();assert.deepEqual(travados(),['ibs','dashboard'])});
await teste('administrador: entra com tudo liberado e vê o botão Administração',async()=>{srv.visitor={data:[{used:0,remaining:20,is_admin:true}],error:null};await entrar('carlos.bella@taxadvice.com.br');
 assert.deepEqual(travados(),[]);assert.ok(d.getElementById('v235-admin-link'));assert.match(d.getElementById('v229-counter').textContent,/Acesso administrativo/)});
await teste('lista do administrador: pendentes primeiro, aviso, período e nomes sem HTML injetado',async()=>{d.getElementById('v235-admin-link').click();await espera();
 const tr=[...d.querySelectorAll('#v235-lista tbody tr')];assert.equal(tr.length,5);assert.equal(tr[0].dataset.v257Sit,'Pendente');assert.equal(tr[1].dataset.v257Sit,'Vencido');assert.equal(tr[4].dataset.v257Sit,'Bloqueado');
 assert.match(d.querySelector('.v257-aviso').textContent,/1 cadastro\(s\) aguardando liberação/);assert.equal(tr[0].querySelector('td b'),null);assert.match(tr[0].cells[0].textContent,/Paulo <b>Pendente<\/b>/);
 assert.equal(d.querySelector('[data-v257-inicio="u-pend"]').value,hoje);assert.equal(d.querySelector('[data-v257-fim="u-pend"]').value,dia(30));assert.equal(d.querySelector('[data-v257-acao="liberar"][data-v257-id="u-pend"]').textContent,'Liberar');
 assert.equal(d.querySelector('[data-v257-acao][data-v257-id="u-adm"]'),null);assert.equal(d.querySelector('[data-v257-acao="liberar"][data-v257-id="u-ativo"]').textContent,'Salvar período')});
await teste('liberar: grava ativo com início e fim escolhidos e a situação passa a Ativo',async()=>{d.querySelector('[data-v257-fim="u-pend"]').value=dia(90);d.querySelector('[data-v257-acao="liberar"][data-v257-id="u-pend"]').click();await espera();
 const c=srv.chamadas.filter(x=>x.action==='update').pop();assert.equal(c.user_id,'u-pend');assert.equal(c.active,true);assert.equal(c.valid_from,hoje);assert.equal(c.valid_until,dia(90));assert.equal(c.role,'usuario');
 assert.equal(d.querySelector('#v235-lista tr[data-v257-sit="Pendente"]'),null);assert.match(d.getElementById('v235-admin-message').textContent,/Acesso liberado de/);assert.equal(d.querySelector('.v257-aviso'),null)});
await teste('liberar recusa período inválido ou já encerrado, sem chamar o servidor',async()=>{const n=srv.chamadas.length;
 d.querySelector('[data-v257-inicio="u-venc"]').value=dia(5);d.querySelector('[data-v257-fim="u-venc"]').value=dia(2);d.querySelector('[data-v257-acao="liberar"][data-v257-id="u-venc"]').click();await espera();
 assert.match(d.getElementById('v235-admin-message').textContent,/fim não pode ser anterior ao início/);
 d.querySelector('[data-v257-inicio="u-venc"]').value=dia(-9);d.querySelector('[data-v257-fim="u-venc"]').value=dia(-2);d.querySelector('[data-v257-acao="liberar"][data-v257-id="u-venc"]').click();await espera();
 assert.match(d.getElementById('v235-admin-message').textContent,/fim do acesso já passou/);assert.equal(srv.chamadas.length,n)});
await teste('bloquear: grava inativo, mantém um período válido e a situação passa a Bloqueado',async()=>{d.querySelector('[data-v257-acao="bloquear"][data-v257-id="u-ativo"]').click();await espera();
 const c=srv.chamadas.filter(x=>x.action==='update').pop();assert.equal(c.user_id,'u-ativo');assert.equal(c.active,false);assert.ok(c.valid_from<=c.valid_until);
 assert.equal([...d.querySelectorAll('#v235-lista tr')].find(r=>/Ana Ativa/.test(r.textContent)).dataset.v257Sit,'Bloqueado')});
await teste('migration: cadastro próprio nasce inativo, sem blocos $$',()=>{const sql=fs.readFileSync(path.join(root,'supabase/migrations/20261120150000_signup_requires_admin_release.sql'),'utf8');
 assert.match(sql,/create or replace function public\.handle_new_user\(\)/);assert.match(sql,/''usuario'', false, current_date, current_date/);assert.doesNotMatch(sql,/\$\$/);
 const fn=fs.readFileSync(path.join(root,'supabase/functions/admin-users/index.ts'),'utf8');assert.match(fn,/active: true, blocked_at: null/);assert.match(fn,/body\.action === 'update'/)});
await teste('build: selo e título V257',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO 257/);assert.match(dist,/<title>Auditoria Reforma Tributária — V257<\/title>/);assert.ok(dist.includes('classificadorV257'))});
w.close();console.log(`${ok} testes focados V257 OK`);process.exit(0);
