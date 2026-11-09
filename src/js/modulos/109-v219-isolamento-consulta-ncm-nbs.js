/* V219 — O menu Consulta NCM e NBS exibe somente os controles e resultados da consulta. */
(function(){
  const LC214='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';
  /* V219 — Resolve o Anexo documentado para a âncora oficial exata; o artigo do Portal é apenas contingência. */
  const romano=valor=>{const alg={I:1,V:5,X:10,L:50,C:100},s=String(valor||'').toUpperCase().replace(/^ANEXO\s+/,'').trim();let total=0,anterior=0;for(let i=s.length-1;i>=0;i--){const atual=alg[s[i]]||0;if(!atual)return 0;total+=atual<anterior?-atual:atual;anterior=Math.max(anterior,atual)}return total};
  window.classificadorUrlAnexoLc214=(anexo,contingencia)=>{const chave=String(anexo||'').toUpperCase().replace(/^ANEXO\s+/,'').trim(),numero=/^\d+$/.test(chave)?Number(chave):romano(chave),alternativa=String(contingencia||'').replace(/\s+/g,'');return numero>0?LC214+'#anexo'+numero:/^https:\/\/(?:www\.)?planalto\.gov\.br\//i.test(alternativa)?alternativa:LC214};
  const aplicar=ativo=>{
    document.body.classList.toggle('v219-modo-consulta',Boolean(ativo));
    document.body.dataset.v219Visao=ativo?'consulta':'demais';
  };
  window.classificadorModoConsultaNcmNbs=aplicar;
  document.getElementById('v123-sidebar')?.addEventListener('click',e=>{
    const botao=e.target.closest('[data-v123-key]');
    if(botao)aplicar(botao.dataset.v123Key==='consulta');
  },true);
  document.getElementById('v123-topbar')?.addEventListener('click',e=>{
    if(e.target.closest('[data-v123-consulta]'))aplicar(true);
  },true);
  const css=document.createElement('style');
  css.textContent='body.v219-modo-consulta header.v123-header{padding:76px 0 0!important;border:0!important;background:transparent!important}body.v219-modo-consulta header.v123-header .header-grid,body.v219-modo-consulta header.v123-header .v137-uploads{display:none!important}';
  document.head.appendChild(css);
  aplicar(false);
})();
