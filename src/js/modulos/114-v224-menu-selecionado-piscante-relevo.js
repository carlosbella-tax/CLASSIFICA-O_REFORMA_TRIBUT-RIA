/* V224 — Menu lateral selecionado com pulsação luminosa e efeito de relevo. */
(function(){
  if(document.getElementById('v224-menu-selecionado-style'))return;
  const css=document.createElement('style');
  css.id='v224-menu-selecionado-style';
  css.textContent=`
    @keyframes v224-menu-pulsar{
      0%,100%{box-shadow:0 3px 7px #041d315c,inset 0 1px 0 #ffffff45,0 0 0 1px #ff7626;filter:brightness(1)}
      50%{box-shadow:0 6px 15px #041d3180,inset 0 1px 0 #ffffff70,0 0 0 3px #ff762699,0 0 17px #ff762680;filter:brightness(1.16)}
    }
    #v123-sidebar .v123-link.active{
      position:relative;
      z-index:2;
      width:calc(100% - 16px);
      margin:3px 8px 7px;
      border-left:5px solid #ff7626;
      border-radius:8px;
      background:linear-gradient(180deg,#226d9d 0%,#12476e 100%)!important;
      color:#fff!important;
      transform:translateY(-2px);
      text-shadow:0 1px 2px #00182b;
      animation:v224-menu-pulsar 1.35s ease-in-out infinite;
    }
    #v123-sidebar .v123-link.active small{
      background:#ff7626!important;
      color:#fff!important;
      box-shadow:0 2px 5px #00182b80;
    }
    @media(prefers-reduced-motion:reduce){
      #v123-sidebar .v123-link.active{animation:none;box-shadow:0 5px 12px #041d3170,inset 0 1px 0 #ffffff60,0 0 0 2px #ff7626}
    }
    @media print{#v123-sidebar .v123-link.active{animation:none}}
  `;
  document.head.appendChild(css);

  /* V224 — Mantém um único destaque mesmo quando opções distintas compartilham a mesma aba técnica. */
  const lateral=document.getElementById('v123-sidebar'),topo=document.getElementById('v123-topbar');
  const destacarUnico=botao=>{
    if(!botao)return;
    lateral.querySelectorAll('.v123-link.active').forEach(item=>item.classList.remove('active'));
    botao.classList.add('active');
  };
  lateral?.addEventListener('click',evento=>destacarUnico(evento.target.closest('.v123-link[data-v123-key]')));
  topo?.addEventListener('click',evento=>{
    if(evento.target.closest('[data-v123-consulta]'))destacarUnico(lateral?.querySelector('[data-v123-key="consulta"]'));
  });
  window.classificadorDestacarMenuUnico=destacarUnico;
  window.classificadorDestaqueMenuSelecionado='v224-menu-pulsar';
})();
