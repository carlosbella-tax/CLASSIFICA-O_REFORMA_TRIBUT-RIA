/* V262 — Relógio do tempo de processamento móvel: o usuário arrasta o relógio para qualquer ponto da tela
   (mouse, toque ou setas do teclado). A posição fica gravada no navegador; duplo clique devolve ao canto
   inferior direito. Não altera a contagem do tempo (V155). */
(function(){
  if (window.V262_CARREGADO) return;
  const relogio=document.getElementById('v155-timer');if(!relogio)return;
  const CHAVE='classificador.v262.relogio',MARGEM=6;
  const st=document.createElement('style');st.id='v262-relogio-style';
  st.textContent='#v155-timer{cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}#v155-timer.v262-arrastando{cursor:grabbing;animation:none!important;box-shadow:0 14px 34px #000c}#v155-timer.v262-movido{right:auto!important;bottom:auto!important}body.v262-sem-selecao,body.v262-sem-selecao *{user-select:none!important;-webkit-user-select:none!important}#v155-timer:focus-visible{outline:2px solid #5B8DEF;outline-offset:2px}@media print{#v155-timer{display:none!important}}';
  document.head.appendChild(st);
  relogio.tabIndex=0;relogio.title='Arraste para mover o relógio. Duplo clique volta ao canto da tela.';
  relogio.setAttribute('aria-label','Tempo de processamento — arraste ou use as setas para mover');
  const limitar=(x,y,larg,alt,tw,th)=>({x:Math.round(Math.min(Math.max(MARGEM,x),Math.max(MARGEM,tw-larg-MARGEM))),y:Math.round(Math.min(Math.max(MARGEM,y),Math.max(MARGEM,th-alt-MARGEM)))});
  let pos=null;
  try{const g=JSON.parse(localStorage.getItem(CHAVE)||'null');if(g&&Number.isFinite(g.x)&&Number.isFinite(g.y))pos={x:g.x,y:g.y}}catch(e){}
  const tamanho=()=>{const r=relogio.getBoundingClientRect();return {l:r.width||194,a:r.height||90}};
  function aplicar(){
    if(!pos){relogio.classList.remove('v262-movido');relogio.style.left='';relogio.style.top='';return}
    const t=tamanho(),p=limitar(pos.x,pos.y,t.l,t.a,window.innerWidth,window.innerHeight);
    relogio.classList.add('v262-movido');relogio.style.left=p.x+'px';relogio.style.top=p.y+'px';
  }
  const gravar=()=>{try{pos?localStorage.setItem(CHAVE,JSON.stringify(pos)):localStorage.removeItem(CHAVE)}catch(e){}};
  function mover(x,y){const t=tamanho();pos=limitar(x,y,t.l,t.a,window.innerWidth,window.innerHeight);aplicar()}
  function restaurar(){pos=null;aplicar();gravar()}
  let arrasto=null;
  relogio.addEventListener('pointerdown',e=>{
    if(e.button!==undefined&&e.button!==0)return;
    const r=relogio.getBoundingClientRect();arrasto={dx:e.clientX-r.left,dy:e.clientY-r.top,id:e.pointerId};
    relogio.classList.add('v262-arrastando');document.body.classList.add('v262-sem-selecao');try{relogio.setPointerCapture(e.pointerId)}catch(x){}e.preventDefault();
  });
  relogio.addEventListener('pointermove',e=>{if(arrasto&&e.pointerId===arrasto.id)mover(e.clientX-arrasto.dx,e.clientY-arrasto.dy)});
  const soltar=e=>{if(!arrasto)return;try{relogio.releasePointerCapture(arrasto.id)}catch(x){}arrasto=null;relogio.classList.remove('v262-arrastando');document.body.classList.remove('v262-sem-selecao');gravar()};
  relogio.addEventListener('pointerup',soltar);relogio.addEventListener('pointercancel',soltar);
  relogio.addEventListener('mousedown',e=>e.preventDefault());
  relogio.addEventListener('dblclick',restaurar);
  relogio.addEventListener('keydown',e=>{
    const d={ArrowLeft:[-20,0],ArrowRight:[20,0],ArrowUp:[0,-20],ArrowDown:[0,20]}[e.key];
    if(e.key==='Home'){restaurar();e.preventDefault();return}
    if(!d)return;const r=relogio.getBoundingClientRect();mover(r.left+d[0],r.top+d[1]);gravar();e.preventDefault();
  });
  window.addEventListener('resize',aplicar);
  /* o relógio nasce oculto: a posição gravada é reaplicada quando ele aparece (o tamanho só existe visível) */
  if(window.MutationObserver)new MutationObserver(aplicar).observe(relogio,{attributes:true,attributeFilter:['hidden']});
  aplicar();
  window.classificadorV262={mover:(x,y)=>{mover(x,y);gravar()},restaurar,limitar,posicao:()=>pos&&{x:pos.x,y:pos.y}};
  window.V262_CARREGADO=true;
})();
