/* V151 — Login, senha e menu de usuário no padrão escuro do Motor. */
(function(){
  const style=document.createElement('style');
  style.textContent=`
.v127-auth{background:radial-gradient(circle at 50% 18%,#30333b 0,#15171d 42%,#0d0f14 100%)!important;backdrop-filter:blur(3px)}
.v127-card{width:min(470px,calc(100vw - 32px))!important;background:#1c1e25!important;border:1px solid #414651!important;border-radius:12px!important;padding:31px!important;color:#f0eee8!important;box-shadow:0 24px 70px #000b!important}
.v127-card h2{font-size:24px!important;color:#f0eee8!important}.v127-card p{color:#bbb6aa!important}.v127-card label{color:#e9e5da!important}.v127-card input{height:44px!important;background:#242730!important;border:1px solid #494e59!important;border-radius:8px!important;color:#f0eee8!important;box-shadow:inset 0 1px #0005!important}.v127-card input:focus{outline:2px solid #ff761c!important;outline-offset:1px!important;border-color:#ff761c!important}.v127-card .v127-btn{min-height:43px!important;background:#292c34!important;border:1px solid #565b65!important;border-radius:8px!important;color:#f0eee8!important}.v127-card .v127-btn:hover{border-color:#ff761c!important;background:#343840!important}.v127-card .v127-btn.alt{background:transparent!important;color:#ddd8cd!important}.v127-card .v127-message{color:#ffb4a8!important}.v145-reset .v127-auth-actions{margin-top:22px}.v145-reset .v127-btn{width:100%;background:#ff761c!important;border-color:#ff761c!important;color:#17130f!important}.v148-close-login{border-color:#5a606c!important;background:#252831!important;color:#f0eee8!important}
.v151-account{position:relative;margin-left:auto;flex:0 0 auto}.v151-account-trigger{display:flex;align-items:center;gap:9px;min-height:46px;padding:0 17px!important;background:#202229!important;border:1px solid #494e59!important;border-radius:24px!important;color:#f0eee8!important;font-size:15px!important}.v151-account-trigger:hover,.v151-account-trigger[aria-expanded="true"]{border-color:#e5e1d6!important;background:#292c34!important}.v151-account-menu{display:none;position:absolute;z-index:100;right:0;top:55px;width:330px;padding:20px;background:#202229;border:1px solid #464b55;border-radius:13px;box-shadow:0 20px 45px #000a;color:#f0eee8}.v151-account.open .v151-account-menu{display:block}.v151-account-name{font-size:18px;font-weight:800;margin:0 0 4px}.v151-account-meta{margin:0;color:#bbb6aa;font-size:14px;line-height:1.55}.v151-account-menu button{display:block;width:100%;margin-top:15px;padding:15px!important;background:#202229!important;border:1px solid #4b505a!important;border-radius:8px!important;color:#f0eee8!important;font-size:17px!important}.v151-account-menu button:hover{border-color:#ff761c!important;background:#292c34!important}.v151-account-menu .v151-logout{margin-top:14px;font-size:15px!important}@media(max-width:1000px){.v151-account{display:none}.v127-card{padding:24px!important}}
`;
  document.head.appendChild(style);
  const top=document.getElementById('v123-topbar');if(!top)return;
  const close=()=>document.getElementById('v151-account')?.classList.remove('open');
  window.addEventListener('click',e=>{if(!e.target.closest('#v151-account'))close()});
  window.addEventListener('classificador:usuario-autenticado',e=>{
    const info=e.detail||{},name=info.nome||info.email||'Usuário';let box=document.getElementById('v151-account');
    if(!box){box=document.createElement('div');box.id='v151-account';box.className='v151-account';top.appendChild(box)}
    const admin=info.role==='admin_taxadvice'?'<button type="button" id="v151-admin">Administração</button>':'';
    box.innerHTML='<button type="button" class="v151-account-trigger" aria-expanded="false" id="v151-account-trigger">⌾ <span>'+name.replace(/[&<>"']/g,'')+'</span>⌄</button><div class="v151-account-menu"><p class="v151-account-name">'+name.replace(/[&<>"']/g,'')+'</p><p class="v151-account-meta">TaxAdvice<br>Ambiente protegido</p>'+admin+'<button type="button" class="v151-logout" id="v151-logout">↪ Sair</button></div>';
    const trigger=document.getElementById('v151-account-trigger');trigger.onclick=()=>{const open=box.classList.toggle('open');trigger.setAttribute('aria-expanded',String(open))};
    document.getElementById('v151-admin')?.addEventListener('click',()=>{close();document.getElementById('v127-admin-link')?.click()});
    document.getElementById('v151-logout').onclick=()=>{close();document.getElementById('v127-logout')?.click();location.reload()};
  });
})();
