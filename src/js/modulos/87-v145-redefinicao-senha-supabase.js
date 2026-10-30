/* V145 — Reconhece o retorno do Supabase e permite definir a nova senha antes de entrar. */
(function(){
  const env=window.CLASSIFICADOR_ENV||{};
  const configured=/^https:\/\/.+\.supabase\.co$/.test(env.supabaseUrl||'')&&!!env.supabaseAnonKey;
  const hash=new URLSearchParams(location.hash.replace(/^#/,''));
  const query=new URLSearchParams(location.search);
  /* V150 — Aceita retorno implicit, PKCE e token_hash sem deixar a tela principal assumir o fluxo. */const recoveryType=hash.get('type')==='recovery'||query.get('type')==='recovery';
  const recoveryRequested=recoveryType||query.has('code');
  if(!configured||!recoveryRequested)return;
  const login=document.getElementById('v127-login');
  if(!login)return;
  const waitForSdk=async()=>{
    if(window.supabase)return window.supabase;
    /* V150 — A recuperação carrega seu próprio SDK porque a inicialização comum fica suspensa neste fluxo. */const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
    const loaded=new Promise((resolve,reject)=>{script.onload=resolve;script.onerror=reject});document.head.appendChild(script);
    await loaded;
    if(window.supabase)return window.supabase;
    throw new Error('Não foi possível preparar a redefinição de senha. Solicite um novo link.');
  };
  const render=(client)=>{
    login.classList.remove('v127-hide');
    login.innerHTML='<div class="v127-card v145-reset"><h2>Definir nova senha</h2><p>Crie sua nova senha para acessar o Classificador.</p><label>Nova senha<input id="v145-password" type="password" autocomplete="new-password" minlength="6"></label><label>Confirmar nova senha<input id="v145-password-confirm" type="password" autocomplete="new-password" minlength="6"></label><div class="v127-auth-actions"><button class="v127-btn" id="v145-save-password">Salvar e entrar</button></div><p class="v127-message" id="v145-message"></p></div>';
    document.getElementById('v145-save-password').onclick=async()=>{
      const message=document.getElementById('v145-message');
      const password=document.getElementById('v145-password').value;
      const confirmation=document.getElementById('v145-password-confirm').value;
      message.textContent='';
      if(password.length<6){message.textContent='A nova senha deve ter pelo menos 6 caracteres.';return}
      if(password!==confirmation){message.textContent='A confirmação da senha não corresponde.';return}
      try{
        const {error}=await client.auth.updateUser({password});
        if(error)throw error;
        message.style.color='#12633c';
        message.textContent='Senha definida com sucesso. Entrando no Classificador…';
        setTimeout(()=>location.replace(location.origin+location.pathname),700);
      }catch(error){message.style.color='#a53320';message.textContent=error.message||'Não foi possível definir a nova senha.'}
    };
  };
  const initialize=async()=>{
    try{
      const sdk=await waitForSdk();
      const client=sdk.createClient(env.supabaseUrl,env.supabaseAnonKey,{auth:{detectSessionInUrl:true}});
      let rendered=false;
      const show=()=>{if(!rendered){rendered=true;render(client)}};
      client.auth.onAuthStateChange((event,session)=>{if(event==='PASSWORD_RECOVERY'&&session)show()});
      let {data:{session}}=await client.auth.getSession();
      if(!session&&query.has('code')){
        const {data,error}=await client.auth.exchangeCodeForSession(query.get('code'));
        if(error)throw error;
        session=data.session;
      }else if(!session&&recoveryType&&query.has('token_hash')){
        const {data,error}=await client.auth.verifyOtp({token_hash:query.get('token_hash'),type:'recovery'});
        if(error)throw error;
        session=data.session;
      }
      if(session)show();
      else throw new Error('Este link de redefinição expirou ou já foi utilizado. Solicite um novo link.');
    }catch(error){
      login.classList.remove('v127-hide');
      login.innerHTML='<div class="v127-card v145-reset"><h2>Link de redefinição inválido</h2><p id="v145-message" class="v127-message"></p><button class="v127-btn" id="v145-return-login">Voltar ao acesso</button></div>';
      document.getElementById('v145-message').textContent=error.message||'Solicite um novo link de redefinição.';
      document.getElementById('v145-return-login').onclick=()=>location.replace(location.origin+location.pathname);
    }
  };
  initialize();
})();
