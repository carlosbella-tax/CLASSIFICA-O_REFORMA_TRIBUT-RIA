/* V267 — Impressão limpa das telas de análise (Dashboard e demais abas): sai somente o conteúdo da tela
   aberta, ocupando a largura da folha, sem menu lateral, sem cabeçalho de empresa/regime, sem botões,
   sem faixas de rolagem e sem áreas em branco de altura fixa. A impressão da Consulta NCM/NBS tem regras
   próprias (V153/V220) e não é alterada. */
(function(){
  if (window.V267_CARREGADO) return;
  /* :not(#_#_#_) não exclui nada; só dá prioridade sobre as regras antigas que usam id */
  const B='html body[data-v267-imprimir]';
  const st=document.createElement('style');st.id='v267-impressao-style';st.textContent=`
@media print{
@page{margin:6mm}
html body>#v123-sidebar:not(#_#_#_),html body>#v123-topbar:not(#_#_#_){display:none!important}
html body:not(#_#_#_){padding-left:0!important;margin-left:0!important}
html:has(body[data-v267-imprimir]){background:#fff!important;height:auto!important;overflow:visible!important}
${B}{margin:0!important;padding:0!important;background:#fff!important;height:auto!important;min-height:0!important;overflow:visible!important;display:block!important}
${B}>*:not(main):not(#_#_#_){display:none!important}
${B}>main.wrap{display:block!important;margin:0!important;padding:0!important;max-width:none!important;width:auto!important;min-height:0!important;height:auto!important;overflow:visible!important;background:#fff!important}
${B}>main.wrap>*:not(.panel.active):not(#_#_#_){display:none!important}
${B}>main.wrap>.panel.active{display:block!important;margin:0!important;padding:0!important;min-height:0!important;height:auto!important;overflow:visible!important;background:#fff!important}
${B} .panel.active>.card,${B} .panel.active .card{margin:0 0 6px!important;box-shadow:none!important}
${B} .panel.active>.card:first-child{margin-top:0!important}
${B} .panel.active button,${B} .panel.active input[type=file],${B} .panel.active select,${B} .panel.active input[type=search],${B} .panel.active input[type=text],${B} .v253-filtros,${B} .v264-topo label,${B} .horizontal-scroll,${B} .dash-print,${B} .v45-bar,${B} .v180-top,${B} [class*="top-scroll"],${B} #v260-kpis,${B} #dashboard .dashboard-hero,${B} .hint.v267-oculto{display:none!important}
${B} .panel.active .table-wrap,${B} .panel.active [class*="-scroll"]{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important;scrollbar-gutter:auto!important}
${B} .panel.active .empty{padding:4px!important}
${B} .panel.active table{width:100%!important}
${B} .panel.active thead{display:table-header-group}
${B} .panel.active tr,${B} .dashboard-card,${B} .dashboard-metric,${B} .v264-q{break-inside:avoid}
${B} *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}`;
  document.head.appendChild(st);
  /* Telas com impressão própria, que este módulo não toca. */
  const PROPRIAS=new Set(['items']);
  function marcar(){
    const p=document.querySelector('main.wrap>.panel.active'),id=p&&p.id;
    if(id&&!PROPRIAS.has(id)){if(document.body.dataset.v267Imprimir!==id)document.body.dataset.v267Imprimir=id}
    else if('v267Imprimir' in document.body.dataset)delete document.body.dataset.v267Imprimir;
    return document.body.dataset.v267Imprimir||'';
  }
  window.addEventListener('beforeprint',marcar);
  document.addEventListener('click',()=>{marcar();setTimeout(marcar,120)},true);
  setInterval(marcar,1000);marcar();
  window.classificadorV267={marcar};
  window.V267_CARREGADO=true;
})();
