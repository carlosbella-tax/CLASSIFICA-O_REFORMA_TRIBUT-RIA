/* V266 — Barra de rolagem horizontal sempre visível: quando uma tabela larga está na tela e a barra dela
   ficou abaixo da parte visível (fim da tabela), aparece uma barra flutuante na borda inferior da janela,
   na mesma largura da tabela, sincronizada com ela. Vale para todas as telas (Enquadramento recomendado,
   Base de IBS/CBS, Fornecedores etc.). A barra é desenhada pela ferramenta (trilho + cursor), para aparecer
   igual em qualquer navegador. Não altera dados nem as tabelas. */
(function(){
  if (window.V266_CARREGADO) return;
  const st=document.createElement('style');st.id='v266-rolagem-style';
  st.textContent='#v266-barra{position:fixed;bottom:0;z-index:90;height:20px;box-sizing:border-box;background:#E3E9F1;border:1px solid #9FB0C4;border-bottom:0;border-radius:7px 7px 0 0;box-shadow:0 -4px 12px #0f2a4a33;cursor:pointer;touch-action:none;user-select:none}#v266-barra[hidden]{display:none}#v266-cursor{position:absolute;top:3px;height:12px;min-width:44px;border-radius:6px;background:#6B7C92;cursor:grab}#v266-cursor:hover{background:#2456C8}#v266-barra.v266-arrastando #v266-cursor{background:#2456C8;cursor:grabbing}@media print{#v266-barra{display:none!important}}';
  document.head.appendChild(st);
  const barra=document.createElement('div');barra.id='v266-barra';barra.hidden=true;barra.setAttribute('aria-hidden','true');barra.title='Arraste para rolar a tabela para os lados';
  const cursor=document.createElement('div');cursor.id='v266-cursor';barra.appendChild(cursor);document.body.appendChild(barra);
  let alvo=null,trilho=0;

  /* Decide, a partir das medidas, se a barra flutuante é necessária para um elemento. */
  function precisa(m,alturaJanela){
    if(!m||m.largura<=0||m.conteudo-m.largura<=4)return false;        /* não há o que rolar para os lados */
    const topoVisivel=Math.max(m.topo,0),fimVisivel=Math.min(m.fim,alturaJanela);
    if(fimVisivel-topoVisivel<60)return false;                         /* tabela fora da tela */
    return m.fim>alturaJanela-2;                                       /* a barra própria está abaixo da parte visível */
  }
  /* Tamanho e posição do cursor para uma largura de trilho, e a rolagem correspondente a uma posição do cursor. */
  function geometria(largura,conteudo,rolagem,trilho){
    const tam=Math.max(44,Math.round(trilho*largura/conteudo)),curso=Math.max(1,trilho-tam),max=Math.max(1,conteudo-largura);
    return {tam,curso,max,pos:Math.round(Math.min(1,Math.max(0,rolagem/max))*curso)};
  }
  const rolagemDe=(pos,g)=>Math.round(Math.min(1,Math.max(0,pos/g.curso))*g.max);
  const medir=e=>{const r=e.getBoundingClientRect();return {topo:r.top,fim:r.bottom,esquerda:r.left,largura:e.clientWidth,conteudo:e.scrollWidth}};
  function candidatos(){
    const raiz=document.querySelector('.panel.active')||document.body,l=[];
    raiz.querySelectorAll('div').forEach(e=>{
      if(e===barra||e===cursor||e.clientWidth<200||e.scrollWidth-e.clientWidth<=4)return;
      const o=getComputedStyle(e).overflowX;if(o==='auto'||o==='scroll')l.push(e)});
    return l;
  }
  function escolher(){
    const h=window.innerHeight;let melhor=null,area=0;
    for(const e of candidatos()){const m=medir(e);if(!precisa(m,h))continue;const a=Math.min(m.fim,h)-Math.max(m.topo,0);if(a>area){area=a;melhor=e}}
    return melhor;
  }
  function desenhar(){
    if(!alvo)return;const g=geometria(alvo.clientWidth,alvo.scrollWidth,alvo.scrollLeft,trilho);
    cursor.style.width=g.tam+'px';cursor.style.left=g.pos+'px';
  }
  function atualizar(){
    const e=escolher();
    if(!e){if(!barra.hidden)barra.hidden=true;alvo=null;return}
    alvo=e;const m=medir(e);trilho=m.largura;
    barra.hidden=false;barra.style.left=Math.max(0,m.esquerda)+'px';barra.style.width=m.largura+'px';desenhar();
  }
  /* arrastar o cursor, ou clicar no trilho para levar o cursor até o ponto */
  let arrasto=null;
  barra.addEventListener('pointerdown',ev=>{
    if(!alvo||(ev.button!==undefined&&ev.button!==0))return;
    const g=geometria(alvo.clientWidth,alvo.scrollWidth,alvo.scrollLeft,trilho),x=ev.clientX-barra.getBoundingClientRect().left;
    let dentro=x-g.pos;
    if(dentro<0||dentro>g.tam){dentro=g.tam/2;alvo.scrollLeft=rolagemDe(x-dentro,g);desenhar()}
    arrasto={dentro,id:ev.pointerId};barra.classList.add('v266-arrastando');try{barra.setPointerCapture(ev.pointerId)}catch(e){}ev.preventDefault();
  });
  barra.addEventListener('pointermove',ev=>{
    if(!arrasto||!alvo||ev.pointerId!==arrasto.id)return;
    const g=geometria(alvo.clientWidth,alvo.scrollWidth,alvo.scrollLeft,trilho);
    alvo.scrollLeft=rolagemDe(ev.clientX-barra.getBoundingClientRect().left-arrasto.dentro,g);desenhar();
  });
  const soltar=()=>{if(!arrasto)return;try{barra.releasePointerCapture(arrasto.id)}catch(e){}arrasto=null;barra.classList.remove('v266-arrastando')};
  barra.addEventListener('pointerup',soltar);barra.addEventListener('pointercancel',soltar);
  barra.addEventListener('wheel',ev=>{if(!alvo)return;alvo.scrollLeft+=(ev.deltaX||ev.deltaY);desenhar();ev.preventDefault()},{passive:false});
  let pendente=0;
  function agendar(){if(pendente)return;pendente=setTimeout(()=>{pendente=0;atualizar()},60)}
  document.addEventListener('scroll',ev=>{if(ev.target===alvo)desenhar();if(!arrasto)agendar()},true);
  window.addEventListener('resize',agendar);
  document.addEventListener('click',()=>setTimeout(agendar,150));
  setInterval(()=>{if(!arrasto)atualizar()},1200);
  window.classificadorV266={precisa,geometria,rolagemDe,atualizar,alvo:()=>alvo};
  window.V266_CARREGADO=true;
})();
