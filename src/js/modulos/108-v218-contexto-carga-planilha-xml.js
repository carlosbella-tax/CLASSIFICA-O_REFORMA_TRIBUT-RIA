/* V218 — Alterna somente o título da área de carga conforme o fluxo ativo: planilha NCM/NBS ou XML. */
(function(){
  const TITULO_XML='Arraste XMLs ou pastas inteiras, ou use os botões abaixo';
  const TITULO_PLANILHA='Arraste PLANILHA NCM OU NBS ou pastas inteiras, ou use os botões abaixo';
  function titulo(){return document.querySelector('#drop > strong')}
  function modo(tipo){
    const el=titulo();if(!el)return;
    const planilha=tipo==='planilha';
    el.textContent=planilha?TITULO_PLANILHA:TITULO_XML;
    el.dataset.v218Modo=planilha?'planilha':'xml';
  }
  window.classificadorModoCarga=modo;
  /* O fluxo documental restaura integralmente o texto original antes da seleção de XML ou pasta. */
  ['files','folder'].forEach(id=>document.getElementById(id)?.addEventListener('change',()=>modo('xml'),true));
  /* V218 — Qualquer seletor documental XML/TXT/PDF também restaura o contexto original. */
  document.addEventListener('change',e=>{
    const campo=e.target;if(!(campo instanceof HTMLInputElement)||campo.type!=='file')return;
    const nome=String(campo.files?.[0]?.name||'').toLowerCase();
    if(/\.(xml|txt|pdf)$/.test(nome))modo('xml');
  },true);
  document.getElementById('selectFolderFull')?.addEventListener('click',()=>modo('xml'),true);
  document.getElementById('clear')?.addEventListener('click',()=>modo('xml'),true);
  modo('xml');
})();
