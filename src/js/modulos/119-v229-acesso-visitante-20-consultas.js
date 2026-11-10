/* V235 — Controle de acesso na Consulta NCM e NBS:
   - Anônimo (sem cadastro): 2 consultas no total (NCM + NBS); ao passar, a tela trava com o
     banner "Conte com a TaxAdvice" e o botão "Falar com um especialista" (WhatsApp +55 11 97074-9434).
   - Menus do sistema aparecem para o anônimo, porém não abrem; só cadastro/conta libera 100%.
   - Cadastrado confirmado: acesso integral (sem limite).
   - Administrador (carlos.bella e quem ele convidar): aba Administração para cadastrar
     usuários e administradores (nome, e-mail, organização, papel e validade). */
(function(){
  const env=window.CLASSIFICADOR_ENV||{};
  const configurado=/^https:\/\/.+\.supabase\.co$/.test(env.supabaseUrl||'')&&!!env.supabaseAnonKey;
  const side=document.getElementById('v123-sidebar'),top=document.getElementById('v123-topbar');
  if(!side||!top)return;
  const LIMITE_ANON=2,WHATS_ESPECIALISTA='https://wa.me/5511970749434?text='+encodeURIComponent('Olá! Gostaria de falar com um especialista da TaxAdvice sobre a Consulta NCM e NBS.');
  const CHAVE_ANON='v235-anonimo-uso';
  let client=null,bypass=false,processando=false;
  const estado={modo:'nao_autenticado',usadas:0,restantes:LIMITE_ANON,email:'',nome:''};

  const css=document.createElement('style');css.id='v235-acesso-style';css.textContent=`
    .v229-auth{position:fixed;inset:0;z-index:12000;display:grid;place-items:center;overflow:auto;padding:20px;background:#071d30ef;font-family:system-ui;color:#173f64}.v229-auth[hidden]{display:none!important}.v229-card{box-sizing:border-box;width:min(560px,100%);margin:auto;padding:18px 22px;max-height:92vh;overflow-y:auto;border:1px solid #8aa7ba;border-radius:16px;background:#fff;box-shadow:0 20px 65px #0009}.v229-brand{margin:0 0 5px;color:#f26a21;font:900 23px Georgia,serif}.v229-card h2{margin:0 0 8px;color:#123f62}.v229-card p{color:#4c6272;line-height:1.45}.v229-tabs{display:flex;gap:8px;margin:18px 0}.v229-tabs button,.v229-submit,.v229-logout{border:0;border-radius:8px;padding:11px 15px;font-weight:800;cursor:pointer}.v229-tabs button{background:#e7eef3;color:#173f64}.v229-tabs button.active,.v229-submit{background:#f26a21;color:#111}.v229-form[hidden]{display:none}.v229-form label{display:block;margin:12px 0 5px;font-weight:800}.v229-form input,.v229-form select{box-sizing:border-box;width:100%;padding:11px;border:1px solid #9eb4c3;border-radius:7px;font:14px system-ui;background:#fff}.v229-submit{width:100%;margin-top:18px}.v229-submit:disabled{opacity:.55;cursor:wait}.v229-message{min-height:22px;margin:12px 0 0!important;font-weight:700}.v229-help{display:inline-block;margin-top:12px;color:#0d6398;font-weight:700}.v229-counter{display:block;margin:10px 0;padding:10px 12px;border:1px solid #4b7795;border-radius:8px;background:#0a2d48;color:#fff;font:700 12px system-ui}.v229-counter b{color:#ff8533}.v229-logout{width:100%;margin-top:7px;background:#324f64;color:#fff}.v229-locked{filter:grayscale(1);opacity:.42!important;cursor:not-allowed!important}.v229-limit{position:fixed;inset:0;z-index:13000;display:none;place-items:center;padding:20px;background:#04111de8}.v229-limit.show{display:grid}.v229-limit-box{box-sizing:border-box;width:min(560px,100%);padding:30px;border:1px solid #f26a21;border-radius:16px;background:#1c2530;color:#fff;box-shadow:0 18px 60px #000}.v229-limit-box h2{margin:0 0 8px;color:#fff}.v229-limit-box .v235-banner{background:#232f3d;border-radius:10px;padding:14px 16px;margin:12px 0}.v229-limit-box .v235-banner h3{margin:0 0 4px;color:#fff;font-size:16px}.v229-limit-box .v235-banner h3 b{color:#f26a21}.v229-limit-box .v235-banner p{margin:0;color:#c8d4de;font-size:13px;line-height:1.45}.v229-limit-box .v235-especialista{display:inline-flex;align-items:center;gap:8px;margin-top:14px;padding:13px 22px;border:0;border-radius:9px;background:#f26a21;color:#111;font-weight:900;font-size:15px;cursor:pointer;text-decoration:none}.v229-limit-box a,.v229-limit-box button{display:block;box-sizing:border-box;width:100%;margin-top:10px;padding:13px;border:0;border-radius:8px;text-align:center;text-decoration:none;font-weight:900;cursor:pointer}.v229-limit-box a.v235-zap{background:#25d366;color:#092f19}.v229-limit-box button{background:#e7eef3;color:#173f64}.v229-user{border-radius:8px;padding:8px 10px;background:#edf4fb;color:#123d60;font:700 12px system-ui;margin:8px 0}.v235-admin-list{width:100%;border-collapse:collapse;font-size:12px;background:#fff;border-radius:6px;overflow:hidden;margin-top:10px}.v235-admin-list th,.v235-admin-list td{text-align:left;padding:8px 7px;border-bottom:1px solid #e5edf2;vertical-align:top;color:#173f64}.v235-admin-list th{background:#ffd5bd;color:#5a2c08}.v235-admin-form{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin:6px 0}.v235-admin-form label{display:block;font-weight:800;margin:0 0 4px}.v235-admin-form .full{grid-column:1/-1}.v229-locked{filter:grayscale(1);opacity:.42!important;cursor:not-allowed!important}@media(max-width:700px){.v235-admin-form{grid-template-columns:1fr}}`;
  document.head.appendChild(css);

  const auth=document.createElement('section');auth.id='v229-auth';auth.className='v229-auth';auth.setAttribute('aria-label','Cadastro e acesso do visitante');auth.innerHTML=`<div class="v229-card"><div class="v229-brand">TaxAdvice</div><h2>Consulta NCM e NBS</h2><p id="v235-sub">Você tem <b>2 consultas gratuitas</b> (somadas entre NCM e NBS) sem cadastro. Para acesso completo e ilimitado, crie sua conta ou entre.</p><div class="v229-tabs"><button type="button" class="active" data-v229-tab="cadastro">Criar cadastro</button><button type="button" data-v229-tab="entrar">Já tenho cadastro</button></div><form id="v229-cadastro" class="v229-form"><label for="v229-nome">Nome</label><input id="v229-nome" autocomplete="name" required><label for="v229-email">E-mail</label><input id="v229-email" type="email" autocomplete="email" required><label for="v229-senha">Senha</label><input id="v229-senha" type="password" autocomplete="new-password" minlength="8" required><button class="v229-submit" type="submit">Cadastrar e confirmar e-mail</button></form><form id="v229-entrar" class="v229-form" hidden><label for="v229-login-email">E-mail</label><input id="v229-login-email" type="email" autocomplete="email" required><label for="v229-login-senha">Senha</label><input id="v229-login-senha" type="password" autocomplete="current-password" required><button class="v229-submit" type="submit">Entrar</button><a class="v229-help" href="#" id="v229-recuperar">Esqueci minha senha</a></form><form id="v229-nova-senha" class="v229-form" hidden><label for="v229-nova-senha-campo">Nova senha</label><input id="v229-nova-senha-campo" type="password" autocomplete="new-password" minlength="8" required><button class="v229-submit" type="submit">Salvar nova senha</button></form><p class="v229-message" id="v229-message"></p></div>`;
  document.body.appendChild(auth);

  const limite=document.createElement('section');limite.id='v229-limit';limite.className='v229-limit';limite.innerHTML=`<div class="v229-limit-box" role="dialog" aria-modal="true"><h2 id="v229-limit-title">Limite de consultas alcançado</h2><div class="v235-banner"><h3><b>Conte com a TaxAdvice</b> na transição tributária.</h3><p>A TaxAdvice estrutura e acompanha cada etapa deste plano com a sua equipe.</p></div><a class="v235-zap" id="v235-zap" href="${WHATS_ESPECIALISTA}" target="_blank" rel="noopener">Falar com um especialista</a><p id="v229-limit-text" style="color:#c8d4de;font-size:13px;margin:6px 0 0"></p><button type="button" id="v235-cadastrar-agora">Criar cadastro — acesso completo</button><button type="button" id="v235-fechar-limite">Voltar</button></div>`;
  document.body.appendChild(limite);
  document.getElementById('v235-cadastrar-agora').onclick=()=>{limite.classList.remove('show');auth.hidden=false;auth.querySelector('[data-v229-tab="cadastro"]').click()};
  document.getElementById('v235-fechar-limite').onclick=()=>limite.classList.remove('show');

  const counter=document.createElement('div');counter.id='v229-counter';counter.className='v229-counter';counter.hidden=true;side.querySelector('.v123-status')?.before(counter);
  const logout=document.createElement('button');logout.id='v229-logout';logout.className='v229-logout';logout.type='button';logout.textContent='Sair';logout.hidden=true;side.querySelector('.v123-status')?.before(logout);

  /* V235 — Aba Administração (somente para admin_taxadvice). */
  const adminAba=document.createElement('section');adminAba.id='v235-admin-aba';adminAba.setAttribute('aria-label','Administração de usuários');adminAba.hidden=true;
  adminAba.innerHTML=`<div class="v229-card" style="width:min(860px,100%);max-height:94vh;overflow-y:auto;padding:16px 22px"><div class="v229-brand">TaxAdvice</div><h2>Administração</h2><p>Cadastre usuários e administradores. Usuários têm acesso completo por período definido; administradores não expiram.</p><form id="v235-form" class="v235-admin-form"><div><label>Nome</label><input id="v235-nome" required></div><div><label>E-mail</label><input id="v235-email" type="email" required></div><div><label>Organização</label><select id="v235-org"><option>TaxAdvice</option></select></div><div><label>Papel</label><select id="v235-papel"><option value="usuario">Usuário</option><option value="admin_taxadvice">Administrador</option></select></div><div class="full"><label id="v235-validade-lb">Válido até (convidado: obrigatório)</label><input id="v235-valido" type="date" required></div><div class="full"><button class="v229-submit" type="submit" style="margin-top:6px">Salvar</button></div></form><p class="v229-message" id="v235-admin-message"></p><div id="v235-lista"></div><button class="v229-logout" type="button" id="v235-fechar-admin">Voltar</button></div>`;
  document.body.appendChild(adminAba);
  document.getElementById('v235-fechar-admin').onclick=()=>{adminAba.hidden=true};

  const mensagem=(texto,ok=false)=>{const el=document.getElementById('v229-message');el.textContent=texto||'';el.style.color=ok?'#17683a':'#a53320'};
  const mensagemAdmin=(texto,ok=false)=>{const el=document.getElementById('v235-admin-message');el.textContent=texto||'';el.style.color=ok?'#17683a':'#a53320'};

  const menus=()=>[...side.querySelectorAll('.v123-link,#v140-audit-tool')];
  const permitido=menu=>menu.dataset.v123Key==='consulta'||menu.id==='v125-contact-link';
  const usoAnonimo=()=>{try{return JSON.parse(localStorage.getItem(CHAVE_ANON)||'{"n":0}')}catch(e){return {n:0}}};
  const registrarAnonimo=()=>{try{const u=usoAnonimo();localStorage.setItem(CHAVE_ANON,JSON.stringify({n:(u.n||0)+1}))}catch(e){}};
  const atualizar=()=>{
    const anon=estado.modo==='nao_autenticado',visitante=estado.modo==='visitante';
    menus().forEach(menu=>{const travado=estado.modo!=='admin'&&!permitido(menu);menu.classList.toggle('v229-locked',travado);menu.setAttribute('aria-disabled',String(travado));if('disabled' in menu)menu.disabled=false;menu.title=travado?'Acesso completo após entrar com cadastro':'';});
    counter.hidden=estado.modo==='nao_autenticado';logout.hidden=counter.hidden;
    if(anon){counter.hidden=true}
    else if(visitante){counter.innerHTML='Consultas utilizadas: <b>'+estado.usadas+'/20</b><br>Restantes: <b>'+estado.restantes+'</b>'}
    else{counter.innerHTML='<b>Acesso administrativo</b><br>Consultas ilimitadas'}
    auth.hidden=estado.modo!=='nao_autenticado';
    if(visitante||estado.modo==='admin')window.classificadorAbrirConsultaInicial?.();
  };
  const aplicar=(modo,dados={})=>{estado.modo=modo;estado.usadas=Number(dados.used??dados.usadas??0);estado.restantes=modo==='admin'?20:Number(dados.remaining??dados.restantes??Math.max(0,20-estado.usadas));estado.email=dados.email||estado.email;estado.nome=dados.nome||estado.nome;atualizar()};
  window.classificadorAplicarAcessoV229=aplicar;
  window.classificadorLimiteVisitante=20;
  window.classificadorLimiteAnonimoV235=LIMITE_ANON;
  window.classificadorWhatsEspecialistaV235=WHATS_ESPECIALISTA;
  window.classificadorExibirLimiteEsgotado=(restrito=false)=>{document.getElementById('v229-limit-title').textContent=restrito?'Recurso restrito ao acesso completo':'Limite de consultas alcançado';document.getElementById('v229-limit-text').textContent=restrito?'Este recurso faz parte do acesso completo da TaxAdvice. Crie seu cadastro para liberar todos os menus.':'Suas 2 consultas sem cadastro foram utilizadas. Crie seu cadastro para acesso completo e ilimitado — ou, se já tiver conta, entre para ter 20 consultas vitalícias.';limite.classList.add('show')};

  const carregarSdk=()=>new Promise((resolve,reject)=>{if(window.supabase)return resolve(window.supabase);const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=()=>window.supabase?resolve(window.supabase):reject(new Error('Não foi possível carregar a biblioteca de acesso.'));s.onerror=()=>reject(new Error('Não foi possível carregar a biblioteca de acesso.'));document.head.appendChild(s)});
  const conectar=async()=>{if(client)return client;if(!configurado)throw new Error('O serviço de cadastro ainda não está configurado nesta cópia.');const sdk=await carregarSdk();client=sdk.createClient(env.supabaseUrl,env.supabaseAnonKey,{auth:{detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});return client};

  const listarUsuarios=async()=>{
    const c=await conectar(),{data,error}=await c.functions.invoke('admin-users',{body:{action:'list'}});
    if(error)throw new Error(error.message);
    if(data?.error)throw new Error(data.error);
    const users=data.users||[];
    document.getElementById('v235-lista').innerHTML='<table class="v235-admin-list"><thead><tr><th>Nome</th><th>E-mail</th><th>Papel</th><th>Válido até</th><th>Situação</th></tr></thead><tbody>'+users.map(u=>'<tr><td>'+String(u.full_name||'—')+'</td><td>'+String(u.email||'—')+'</td><td>'+(u.role==='admin_taxadvice'?'Administrador':'Usuário')+'</td><td>'+(u.valid_until||'—')+'</td><td>'+((u.active&&!u.blocked_at)?'Ativo':'Bloqueado')+'</td></tr>').join('')+'</tbody></table>';
  };
  document.getElementById('v235-form').onsubmit=async e=>{
    e.preventDefault();const botao=e.submitter||e.currentTarget?.querySelector('[type=submit]')||e.target?.querySelector('[type=submit]');
    const nome=document.getElementById('v235-nome').value.trim(),email=document.getElementById('v235-email').value.trim(),papel=document.getElementById('v235-papel').value,valido=document.getElementById('v235-valido').value;
    try{
      if(nome.length<2)throw new Error('Informe o nome.');
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Informe um e-mail válido.');
      if(papel!=='admin_taxadvice'&&!valido)throw new Error('Informe a validade do acesso do usuário.');
      botao.disabled=true;mensagemAdmin('Criando convite…',true);
      const c=await conectar(),{data,error}=await c.functions.invoke('admin-users',{body:{action:'invite',email,full_name:nome,role:papel,valid_from:new Date().toISOString().slice(0,10),valid_until:valido||null,redirect_to:location.origin+location.pathname}});
      if(error)throw new Error(error.message);
      if(data?.error)throw new Error(data.error);
      mensagemAdmin('Convite criado. O usuário receberá o e-mail de confirmação.',true);
      document.getElementById('v235-form').reset();await listarUsuarios();
    }catch(x){mensagemAdmin(x.message||'Não foi possível criar o convite.')}finally{botao.disabled=false}
  };

  const abrirAdmin=async()=>{adminAba.hidden=false;mensagemAdmin('');try{await listarUsuarios()}catch(x){mensagemAdmin(x.message||'Não foi possível listar os usuários.')}};
  window.classificadorAbrirAdministracaoV235=abrirAdmin;

  const iniciarUsuario=async usuario=>{
    if(!usuario?.email_confirmed_at){await client?.auth.signOut();aplicar('nao_autenticado');throw new Error('Confirme o e-mail recebido antes de entrar.')}
    const {data,error}=await client.rpc('visitor_consultation_status');
    if(error)throw error;
    const s=data?.[0]||{};
    const email=usuario.email||'';
    const admin=email==='carlos.bella@taxadvice.com.br'||s.is_admin;
    aplicar(admin?'admin':'visitante',{used:s.used,remaining:s.remaining,email,nome:usuario.user_metadata?.full_name||''});
    document.getElementById('v235-admin-link')?.remove();
    if(admin){
      const botaoAdmin=document.createElement('button');botaoAdmin.id='v235-admin-link';botaoAdmin.className='v229-logout';botaoAdmin.type='button';botaoAdmin.textContent='Administração';
      botaoAdmin.onclick=()=>window.classificadorAbrirAdministracaoV235?.();
      side.querySelector('.v123-status')?.before(botaoAdmin);
    }
  };

  auth.querySelectorAll('[data-v229-tab]').forEach(botao=>botao.onclick=()=>{auth.querySelectorAll('[data-v229-tab]').forEach(x=>x.classList.toggle('active',x===botao));document.getElementById('v229-cadastro').hidden=botao.dataset.v229Tab!=='cadastro';document.getElementById('v229-entrar').hidden=botao.dataset.v229Tab!=='entrar';mensagem('')});
  document.getElementById('v229-cadastro').onsubmit=async e=>{e.preventDefault();const botao=e.submitter||e.currentTarget?.querySelector('[type=submit]')||e.target?.querySelector('[type=submit]'),nome=document.getElementById('v229-nome').value.trim(),email=document.getElementById('v229-email').value.trim(),senha=document.getElementById('v229-senha').value;try{if(nome.length<2)throw new Error('Informe seu nome.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Informe um e-mail válido.');if(senha.length<8)throw new Error('A senha deve ter pelo menos 8 caracteres.');botao.disabled=true;mensagem('Criando cadastro…',true);const c=await conectar(),{data,error}=await c.auth.signUp({email,password:senha,options:{data:{full_name:nome},emailRedirectTo:location.origin+location.pathname}});if(error)throw error;if(data.session){await c.auth.signOut();throw new Error('A confirmação de e-mail precisa ser ativada no Supabase antes da liberação pública.')}mensagem('Cadastro criado. Abra o e-mail de confirmação e depois entre com sua senha.',true)}catch(x){mensagem(x.message||'Não foi possível criar o cadastro.')}finally{botao.disabled=false}};
  document.getElementById('v229-entrar').onsubmit=async e=>{e.preventDefault();const botao=e.submitter||e.currentTarget?.querySelector('[type=submit]')||e.target?.querySelector('[type=submit]'),email=document.getElementById('v229-login-email').value.trim(),password=document.getElementById('v229-login-senha').value;try{botao.disabled=true;mensagem('Validando acesso…',true);const c=await conectar(),{data,error}=await c.auth.signInWithPassword({email,password});if(error)throw error;await iniciarUsuario(data.user)}catch(x){mensagem(x.message||'E-mail ou senha inválidos.')}finally{botao.disabled=false}};
  document.getElementById('v229-recuperar').onclick=async e=>{e.preventDefault();try{const email=document.getElementById('v229-login-email').value.trim();if(!email)throw new Error('Informe seu e-mail para recuperar a senha.');const c=await conectar(),{error}=await c.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;mensagem('Enviamos as instruções de recuperação para seu e-mail.',true)}catch(x){mensagem(x.message||'Não foi possível enviar a recuperação.')}};
  const mostrarNovaSenha=()=>{auth.hidden=false;auth.querySelector('.v229-tabs').hidden=true;document.getElementById('v229-cadastro').hidden=true;document.getElementById('v229-entrar').hidden=true;document.getElementById('v229-nova-senha').hidden=false};
  document.getElementById('v229-nova-senha').onsubmit=async e=>{e.preventDefault();const botao=e.submitter||e.currentTarget?.querySelector('[type=submit]')||e.target?.querySelector('[type=submit]'),password=document.getElementById('v229-nova-senha-campo').value;try{if(password.length<8)throw new Error('A senha deve ter pelo menos 8 caracteres.');botao.disabled=true;const c=await conectar(),{data,error}=await c.auth.updateUser({password});if(error)throw error;await iniciarUsuario(data.user)}catch(x){mensagem(x.message||'Não foi possível alterar a senha.')}finally{botao.disabled=false}};
  logout.onclick=async()=>{try{await client?.auth.signOut()}finally{document.getElementById('v235-admin-link')?.remove();adminAba.hidden=true;auth.querySelector('.v229-tabs').hidden=false;document.getElementById('v229-nova-senha').hidden=true;document.getElementById('v229-cadastro').hidden=false;document.getElementById('v229-entrar').hidden=true;aplicar('nao_autenticado');mensagem('Acesso encerrado.',true)}};

  /* V235 — Cliques: menus travados para anônimo e visitante; consultas: 2 para anônimo (local), 20 vitalícias para visitante (Supabase). */
  document.addEventListener('click',e=>{
    if(bypass)return;
    const menu=e.target.closest('#v123-sidebar .v123-link,#v140-audit-tool');
    if(menu&&estado.modo!=='admin'&&!permitido(menu)){e.preventDefault();e.stopImmediatePropagation();window.classificadorExibirLimiteEsgotado(true);return}
    const botao=e.target.closest('[data-v123-consulta]');
    if(!botao)return;
    if(estado.modo==='admin')return;
    const tipo=botao.dataset.v123Consulta,termo=document.getElementById('v123-'+tipo)?.value.trim();
    if(!termo)return;
    if(estado.modo==='nao_autenticado'){
      const u=usoAnonimo();
      if((u.n||0)>=LIMITE_ANON){e.preventDefault();e.stopImmediatePropagation();window.classificadorExibirLimiteEsgotado();return}
      registrarAnonimo();
      const rest=LIMITE_ANON-(u.n||0)-1;
      if(rest<=0)setTimeout(()=>window.classificadorExibirLimiteEsgotado(),2600);
      return;
    }
    e.preventDefault();e.stopImmediatePropagation();
    if(processando)return;processando=true;botao.disabled=true;
    (async()=>{try{const c=await conectar(),{data,error}=await c.rpc('consume_visitor_consultation',{p_type:tipo,p_query_term:termo});if(error)throw error;const s=data?.[0];if(!s?.allowed){aplicar('visitante',{used:s?.used??20,remaining:0});window.classificadorExibirLimiteEsgotado();return}aplicar('visitante',{used:s.used,remaining:s.remaining});bypass=true;botao.click();bypass=false}catch(x){mensagem(x.message||'Não foi possível contabilizar a consulta.');auth.hidden=false}finally{bypass=false;processando=false;botao.disabled=false}})();
  },true);

  aplicar('nao_autenticado');
  if(!configurado){mensagem('Configure o Supabase para ativar cadastro, confirmação de e-mail e contagem segura.');return}
  conectar().then(async c=>{const {data}=await c.auth.getSession();if(data.session?.user)await iniciarUsuario(data.session.user);c.auth.onAuthStateChange((evento,sessao)=>{if(evento==='PASSWORD_RECOVERY')mostrarNovaSenha();else if(evento==='SIGNED_OUT')aplicar('nao_autenticado');else if(sessao?.user)setTimeout(()=>iniciarUsuario(sessao.user).catch(x=>mensagem(x.message)),0)})}).catch(x=>mensagem(x.message||'Não foi possível conectar ao serviço de acesso.'));
})();
