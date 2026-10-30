/* V141 — Abre o acesso da conta autorizada sem retornar ao cadastro público. */
(function(){
  const env=window.CLASSIFICADOR_ENV||{};
  const configured=/^https:\/\/.+\.supabase\.co$/.test(env.supabaseUrl||'')&&!!env.supabaseAnonKey;
  const login=document.getElementById('v127-login');
  if(!login||!configured)return;
  const render=()=>{
    login.classList.remove('v127-hide');
    /* V148 — Permite conferir a senha e fechar o formulário sem perder o retorno à tela inicial. */
    login.innerHTML='<div class="v127-card v148-login-card"><button class="v148-close-login" type="button" id="v148-close-login" aria-label="Fechar e voltar à tela inicial" title="Fechar">×</button><h2>Acesso ao Classificador</h2><p>Entre com a conta autorizada pela TaxAdvice para utilizar o ambiente protegido.</p><label>E-mail</label><input id="v141-login-email" type="email" autocomplete="email"><label>Senha</label><div class="v148-password-wrap"><input id="v141-login-password" type="password" autocomplete="current-password"><button class="v148-password-toggle" type="button" id="v148-password-toggle" aria-label="Mostrar senha" title="Mostrar senha">◉</button></div><div class="v127-auth-actions"><button class="v127-btn" id="v141-login-submit">Entrar</button><button class="v127-btn alt" type="button" id="v141-forgot-password">Esqueci minha senha</button></div><p class="v127-message" id="v141-login-msg"></p></div>';
    const style=document.createElement('style');
    style.textContent='.v148-login-card{position:relative}.v148-close-login{position:absolute;top:13px;right:13px;width:34px;height:34px;padding:0;border:1px solid #5a606c;border-radius:50%;background:#262a32;color:#fff;font:400 29px/30px system-ui;cursor:pointer}.v148-close-login:hover{background:#ff761c;color:#15171b;border-color:#ff761c}.v148-password-wrap{position:relative}.v148-password-wrap input{padding-right:54px}.v148-password-toggle{position:absolute;right:7px;top:50%;transform:translateY(-50%);width:38px;height:34px;padding:0;border:0;border-radius:7px;background:transparent;color:#cfd4dc;font:700 20px/34px system-ui;cursor:pointer}.v148-password-toggle:hover{background:#343a45;color:#ff761c}';
    document.head.appendChild(style);
    const message=document.getElementById('v141-login-msg');
    const client=()=>{
      if(!window.supabase)throw new Error('Aguarde um instante e tente novamente.');
      return window.supabase.createClient(env.supabaseUrl,env.supabaseAnonKey);
    };
    const allowed=p=>!!(p&&p.active&&!p.blocked_at&&(p.role==='admin_taxadvice'||(p.role==='usuario'&&p.valid_until&&p.valid_until>=new Date().toISOString().slice(0,10))));
    document.getElementById('v141-login-submit').onclick=async()=>{message.textContent='';try{const c=client();const {data,error}=await c.auth.signInWithPassword({email:document.getElementById('v141-login-email').value.trim(),password:document.getElementById('v141-login-password').value});if(error)throw error;const {data:profile,error:profileError}=await c.from('profiles').select('full_name,role,active,valid_until,blocked_at').eq('id',data.user.id).maybeSingle();if(profileError)throw profileError;if(!allowed(profile)){await c.auth.signOut();throw new Error('Acesso não autorizado, bloqueado ou expirado.')}login.classList.add('v127-hide');window.dispatchEvent(new CustomEvent('classificador:usuario-autenticado',{detail:{nome:profile.full_name||'',email:data.user.email||'',role:profile.role||''}}))}catch(e){message.textContent=e.message||'Não foi possível entrar.'}};
    document.getElementById('v141-forgot-password').onclick=async()=>{message.textContent='';try{const email=document.getElementById('v141-login-email').value.trim();if(!email)throw new Error('Informe seu e-mail para receber o link de redefinição.');const {error}=await client().auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error;message.style.color='#12633c';message.textContent='Enviamos um link para redefinir sua senha ao e-mail informado.'}catch(e){message.textContent=e.message||'Não foi possível enviar a redefinição de senha.'}};
    document.getElementById('v148-password-toggle').onclick=()=>{const field=document.getElementById('v141-login-password'),button=document.getElementById('v148-password-toggle'),show=field.type==='password';field.type=show?'text':'password';button.textContent=show?'◉':'◌';button.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');button.title=show?'Ocultar senha':'Mostrar senha';};
    document.getElementById('v148-close-login').onclick=()=>location.reload();
  };
  /* V143 — API explícita para o botão do cadastro público, independente da ordem dos handlers. */
  window.classificadorAbrirLogin=render;
  window.addEventListener('classificador:abrir-login',render);
  window.addEventListener('click',e=>{if(e.target.closest('#v139-login')){e.preventDefault();e.stopImmediatePropagation();render()}},true);
})();
