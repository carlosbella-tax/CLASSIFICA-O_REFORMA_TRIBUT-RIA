/* V145 — Tratava o retorno de redefinição de senha do Supabase. */
/* V197 — A autenticação agora usa link mágico; nenhum campo de senha é exibido. */
(function(){
  const hash=new URLSearchParams(location.hash.replace(/^#/,''));
  const query=new URLSearchParams(location.search);
  const recovery=hash.get('type')==='recovery'||query.get('type')==='recovery';
  if(!recovery)return;
  const login=document.getElementById('v127-login');
  if(!login)return;
  login.classList.remove('v127-hide');
  login.innerHTML='<div class="v127-card v145-reset"><h2>Acesso por link seguro</h2><p>A redefinição por senha foi desativada. Volte ao acesso e solicite um link mágico no e-mail da conta autorizada.</p><button class="v127-btn" id="v145-return-login">Voltar ao acesso</button></div>';
  document.getElementById('v145-return-login').onclick=()=>location.replace(location.origin+location.pathname);
})();
