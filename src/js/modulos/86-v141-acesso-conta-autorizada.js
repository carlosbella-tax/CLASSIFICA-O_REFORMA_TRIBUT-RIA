/* V141 — Abre o acesso da conta autorizada sem retornar ao cadastro público. */
/* V197 — Acesso sem senha por link mágico, restrito a e-mails previamente autorizados. */
(function(){
  const env=window.CLASSIFICADOR_ENV||{};
  const configured=/^https:\/\/.+\.supabase\.co$/.test(env.supabaseUrl||'')&&!!env.supabaseAnonKey;
  const login=document.getElementById('v127-login');
  if(!login||!configured)return;
  const render=()=>{
    login.classList.remove('v127-hide');
    /* V197 — Solicita somente o e-mail e preserva o retorno à tela inicial. */
    login.innerHTML='<div class="v127-card v148-login-card"><button class="v148-close-login" type="button" id="v148-close-login" aria-label="Fechar e voltar à tela inicial" title="Fechar">×</button><h2>Acesso ao Classificador</h2><p>Informe o e-mail da conta autorizada pela TaxAdvice. Você receberá um link seguro para entrar, sem senha.</p><label>E-mail</label><input id="v141-login-email" type="email" autocomplete="email"><div class="v127-auth-actions"><button class="v127-btn" id="v141-login-submit">Enviar link de acesso</button></div><p class="v127-message" id="v141-login-msg"></p></div>';
    const style=document.createElement('style');
    style.textContent='.v148-login-card{position:relative}.v148-close-login{position:absolute;top:13px;right:13px;width:34px;height:34px;padding:0;border:1px solid #5a606c;border-radius:50%;background:#262a32;color:#fff;font:400 29px/30px system-ui;cursor:pointer}.v148-close-login:hover{background:#ff761c;color:#15171b;border-color:#ff761c}';
    document.head.appendChild(style);
    const message=document.getElementById('v141-login-msg');
    const client=()=>{
      if(!window.supabase)throw new Error('Aguarde um instante e tente novamente.');
      return window.supabase.createClient(env.supabaseUrl,env.supabaseAnonKey);
    };
    const hoje=()=>new Date().toISOString().slice(0,10);const allowed=p=>!!(p&&p.active&&!p.blocked_at&&(p.role==='admin_taxadvice'||(p.role==='usuario'&&p.valid_from&&p.valid_until&&p.valid_from<=hoje()&&p.valid_until>=hoje())));const expirado=p=>!!(p?.role==='usuario'&&p.valid_until&&p.valid_until<hoje());
    document.getElementById('v141-login-submit').onclick=async e=>{const button=e.currentTarget;message.textContent='';try{const email=document.getElementById('v141-login-email').value.trim();if(!email)throw new Error('Informe seu e-mail para receber o link de acesso.');button.disabled=true;button.textContent='Enviando…';const {error}=await client().auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname,shouldCreateUser:false}});if(error)throw error;message.style.color='#12633c';message.textContent='Se o e-mail estiver autorizado, você receberá um link seguro para entrar.'}catch(e){message.style.color='#a53320';message.textContent=e.message||'Não foi possível enviar o link de acesso.'}finally{button.disabled=false;button.textContent='Enviar link de acesso'}};
    document.getElementById('v148-close-login').onclick=()=>location.reload();
  };
  /* V143 — API explícita para o botão do cadastro público, independente da ordem dos handlers. */
  window.classificadorAbrirLogin=render;
  window.addEventListener('classificador:abrir-login',render);
  window.addEventListener('click',e=>{if(e.target.closest('#v139-login')){e.preventDefault();e.stopImmediatePropagation();render()}},true);
})();
