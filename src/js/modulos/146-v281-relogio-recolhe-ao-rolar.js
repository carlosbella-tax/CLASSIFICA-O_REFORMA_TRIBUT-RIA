/* V281 — Relógio do tempo de processamento não fica na frente do conteúdo quando a tela é rolada: ao descer
   a página (ou rolar o quadro de uma tabela), o relógio se recolhe, em formato compacto, na barra do título,
   que é fixa no topo e tem o espaço reservado para ele. De volta ao topo, o relógio retoma o passeio pela
   tela (V280) do ponto em que estava. Recolhido, ele não é arrastado. Não altera a contagem do tempo (V155).
   A barra do título e o menu passam a ficar acima dos cabeçalhos das tabelas: antes, com a página rolada, o
   cabeçalho de uma tabela passava por cima do título da tela (e passaria por baixo do relógio recolhido). */
(function(){
  if (window.V281_CARREGADO) return;
  const relogio=document.getElementById('v155-timer');if(!relogio)return;
  const LIMIAR=4,FOLGA=16;
  const TITULO='Relógio recolhido na barra do título enquanto a tela está rolada, para não cobrir o conteúdo. Volte ao topo da página para ele andar pela tela.';
  const st=document.createElement('style');st.id='v281-relogio-style';
  st.textContent=[
    /* camadas: cabeçalhos de tabela usam até 60; a barra de rolagem flutuante (V266) usa 90. A ordem entre barra, menu, marca e botão do menu é a mesma de antes */
    'html body #v123-topbar{z-index:70!important}html body #v123-sidebar{z-index:71!important}html body .v258-dev{z-index:72!important}html body .v123-header .brand{z-index:76!important}html body #v260-toggle{z-index:77!important}html body.v219-modo-consulta #v223-logo-consulta{z-index:78!important}',
    /* seletor repetido para valer sobre a posição do arrastar (V262) e do passeio (V280); [hidden] continua escondendo */
    '#v155-timer.v281-recolhido.v281-recolhido{left:auto!important;bottom:auto!important;right:'+FOLGA+'px!important;top:var(--v281-topo,8px)!important;width:auto!important;min-width:0!important;padding:5px 12px!important;border-radius:8px!important;box-shadow:0 2px 8px #0005!important;cursor:default!important;will-change:auto}',
    '#v155-timer.v281-recolhido #v269-alca,#v155-timer.v281-recolhido small{display:none!important}',
    '#v155-timer.v281-recolhido strong{font-size:18px!important;line-height:1.15!important;margin:0!important}',
    '#v155-timer.v281-recolhido span{display:block;font-size:10.5px!important;line-height:1.25!important;white-space:nowrap}',
    /* a barra do título reserva o lugar do relógio; o título quebra em duas linhas em vez de passar por baixo dele */
    'body.v281-relogio-recolhido #v123-topbar{padding-right:calc(var(--v281-larg,170px) + '+(FOLGA*2)+'px)!important}',
    'body.v281-relogio-recolhido #v123-topbar .v123-page-title{white-space:normal!important;min-width:0!important;line-height:1.2!important;max-height:100%;overflow:hidden!important}'
  ].join('');
  document.head.appendChild(st);
  let recolhido=false,tituloAntes='';
  /* quadros internos (tabelas, listas, janelas) que o usuário rolou para baixo; o menu lateral e os campos de texto não contam */
  const rolados=new Set();
  const conta=e=>!!e&&e.nodeType===1&&!/^(TEXTAREA|INPUT|SELECT)$/.test(e.tagName)&&!e.closest('#v123-sidebar,#v155-timer');
  const aberto=q=>{const p=q.closest('.panel');return (!p||p.classList.contains('active'))&&!q.closest('[hidden]')};
  function quadroRolado(){
    for(const q of rolados){
      if(!q.isConnected||!(q.scrollTop>LIMIAR)){rolados.delete(q);continue}
      if(aberto(q))return true;
    }
    return false;
  }
  const rolado=()=>(window.scrollY||window.pageYOffset||document.documentElement.scrollTop||0)>LIMIAR||quadroRolado();
  function posicionar(){
    const b=document.getElementById('v123-topbar'),q=b?b.getBoundingClientRect():null,r=relogio.getBoundingClientRect(),alt=r.height||46;
    const topo=q&&q.height>0?Math.max(4,Math.round(q.top+(q.height-alt)/2)):8;
    relogio.style.setProperty('--v281-topo',topo+'px');
    document.body.style.setProperty('--v281-larg',Math.round(r.width||170)+'px');
  }
  function avaliar(){
    const deve=!relogio.hidden&&rolado();
    if(deve!==recolhido){
      recolhido=deve;
      relogio.classList.toggle('v281-recolhido',deve);document.body.classList.toggle('v281-relogio-recolhido',deve);
      if(deve){tituloAntes=relogio.title;relogio.title=TITULO}else if(tituloAntes)relogio.title=tituloAntes;
    }
    if(recolhido)posicionar();
    return recolhido;
  }
  /* recolhido, o relógio não é arrastado, não anda pelas setas nem responde ao duplo clique */
  for(const tipo of ['pointerdown','mousedown','dblclick','keydown'])
    document.addEventListener(tipo,e=>{if(recolhido&&relogio.contains(e.target))e.stopPropagation()},true);
  /* a rolagem dos quadros de tabela não sobe até o documento: é ouvida na fase de captura */
  document.addEventListener('scroll',e=>{if(conta(e.target))rolados.add(e.target);avaliar()},true);window.addEventListener('scroll',avaliar);window.addEventListener('resize',avaliar);
  /* o relógio aparece e some conforme o processamento */
  if(window.MutationObserver)new MutationObserver(avaliar).observe(relogio,{attributes:true,attributeFilter:['hidden']});
  /* troca de tela e recolhimento do menu mudam o que está rolado e a barra do título */
  setInterval(avaliar,400);
  avaliar();
  window.classificadorV281={avaliar,rolado,recolhido:()=>recolhido,LIMIAR};
  window.V281_CARREGADO=true;
})();
