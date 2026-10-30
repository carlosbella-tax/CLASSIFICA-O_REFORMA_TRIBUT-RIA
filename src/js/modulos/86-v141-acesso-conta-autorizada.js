/* V141 — Abre o acesso da conta autorizada sem retornar ao cadastro público. */
(function(){
  const env=window.CLASSIFICADOR_ENV||{};
  const configured=/^https:\/\/.+\.supabase\.co$/.test(env.supabaseUrl||'')&&!!env.supabaseAnonKey;
  const login=document.getElementById('v127-login');
  if(!login||!configured)return;
  const render=()=>{
    login.classList.remove('v127-hide');
    login.innerHTML='<div class="v127-card"><h2>Acesso ao Classificador</h2><p>Entre com a conta autorizada pela TaxAdvice para utilizar o ambiente protegido.</p><label>E-mail</label><input id="v141-login-email" type="email" autocomplete="email"><label>Senha</label><input id="v141-login-password" type="password" autocomplete="current-password"><div class="v127-auth-actions"><button class="v127-btn" id="v141-login-submit">Entrar</button><button class="v127-btn alt" type="button" id="v141-forgot-password">Esqueci minha senha</button></div><p class="v127-message" id="v141-login-msg"></p></div>';
    const message=document.getElementById('v141-login-msg');
    const client=()=>{
      if(!window.supabase)throw new Error('Aguarde um instante e tente novamente.');
      return window.supabase.createClient(env.supabaseUrl,env.supabaseAnonKey);
    };
    const allowed=p=>!!(p&&p.active&&!p.blocked_at&&(p.role==='admin_taxadvice'||(p.role==='usuario'&&p.valid_until&&p.valid_until>=new Date().toISOString().slice(0,10))));
    document.getElementById('v141-login-submit').onclick=async()=>{message.textContent='';try{const c=client();const {data,error}=await c.auth.signInWithPassword({email:document.getElementById('v141-login-email').value.trim(),password:document.getElementById('v141-login-password').value});if(error)throw error;const {data:profile,error:profileError}=await c.from('profiles').select('full_name,role,active,valid_until,blocked_at').eq('id',data.user.id).maybeSingle();if(profileError)throw profileError;if(!allowed(profile)){await c.auth.signOut();throw new Error('Acesso não autorizado, bloqueado ou expirado.')}login.classList.add('v127-hide');window.dispatchEvent(new CustomEvent('classificador:usuario-autenticado',{detail:{nome:profile.full_name||'',email:data.user.email||''}}))}catch(e){message.textContent=e.message||'Não foi possível entrar.'}};
    document.getElementById('v141-forgot-password').onclick=async()=>{message.textContent='';try{const email=document.getElementById('v141-login-email').value.trim();if(!email)throw new Error('Informe seu e-mail para receber o link de redefinição.');const {error}=await client().auth.resetPasswordForEmail(email,{redirectTo:location.origin});if(error)throw error;message.style.color='#12633c';message.textContent='Enviamos um link para redefinir sua senha ao e-mail informado.'}catch(e){message.textContent=e.message||'Não foi possível enviar a redefinição de senha.'}};
  };
  window.addEventListener('click',e=>{if(e.target.closest('#v139-login')){e.preventDefault();e.stopImmediatePropagation();render()}},true);
})();
