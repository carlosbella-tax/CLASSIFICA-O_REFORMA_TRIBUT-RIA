/* V268 — Design "Carbon + TaxAdvice", aprovado em 22/11/2026: padrão de telas densas (IBM Carbon) com a
   identidade da TaxAdvice. Cantos retos, fundo cinza-claro, cabeçalho de tabela cinza, linhas compactas,
   faixa colorida no topo dos indicadores e laranja da TaxAdvice no item ativo do menu. Vale para as telas
   de análise; a Consulta NCM/NBS mantém o fundo escuro. Só apresentação: não muda dados nem cálculos. */
(function(){
  if (window.V268_CARREGADO) return;
  const A='body.v255:not(.v219-modo-consulta)',M=A+' main';
  const css=`
body.v255{--v268-laranja:#F26B21;--v268-azul:#2456C8;--v268-fundo:#F4F4F4;--v268-linha:#E0E0E0;--v268-tinta:#161616;--v268-mudo:#525252}
html body.v255 #v123-sidebar .v123-link.active{border-left-color:var(--v268-laranja)!important;background:rgba(255,255,255,.14)!important}
html body.v255 #v123-sidebar .v123-link.active small{background:var(--v268-laranja)!important;color:#fff!important}
html body.v255 .v255-densidade button{border-radius:0!important}
html body.v255 .v255-densidade button.on{background:var(--v268-laranja)!important;border-color:var(--v268-laranja)!important}
${A}{background:var(--v268-fundo)!important;color:var(--v268-tinta)}
${M} .panel{background:var(--v268-fundo)!important}
${M} .card,${M} .dashboard-card,${M} .dashboard-metric,${M} .v45-bar,${M} .v168-card,${M} .v168-parametros,${M} #v183-dashboard .v183-bloco,${M} #v183-dashboard .v183-grafico,${M} .table-wrap,${M} .v264-q,${M} .v260-kpi,${M} .dashboard-hero{border-radius:0!important;box-shadow:none!important}
${M} .card,${M} .dashboard-card,${M} .v168-card{border:1px solid var(--v268-linha)!important;background:#fff}
${M} .v260-kpi,${M} .dashboard-metric,${M} .v264-q{border:0!important;border-top:3px solid var(--v268-azul)!important;background:#fff!important}
${M} .v260-kpi.alerta{border-top-color:#F1C21B!important}
${M} .v260-kpi.ok{border-top-color:#198038!important}
${M} .v260-kpi b,${M} .dashboard-metric b,${M} .dashboard-metric strong{font-weight:600!important;color:var(--v268-tinta)!important}
${M} .v260-kpi label{color:var(--v268-mudo)!important;letter-spacing:.02em!important}
${M} h2,${M} h3{color:#0F2A4A;font-weight:600;letter-spacing:0}
${M} button,${M} select,${M} input,${M} textarea{border-radius:0!important}
${M} button:not(:disabled):hover{filter:brightness(.96)}
${M} #v155-process{background:var(--v268-azul)!important;border-color:var(--v268-azul)!important}
${M} input:focus,${M} select:focus,${M} textarea:focus,${M} button:focus-visible{outline:2px solid var(--v268-azul)!important;outline-offset:-2px}
${M} table{font-size:12.5px}
${M} table th{background:#E0E0E0!important;color:var(--v268-tinta)!important;font-size:12px!important;font-weight:600!important;letter-spacing:0!important;text-transform:none!important;border-bottom:1px solid #C6C6C6!important}
${M} table td{border-bottom:1px solid var(--v268-linha)!important;padding-top:7px;padding-bottom:7px}
${M} table tbody tr:hover td{background-color:#E8E8E8!important}
${M} .table-wrap{border:1px solid var(--v268-linha)!important;background:#fff!important}
${M} td .valid,${M} td .invalid,${M} td.valid,${M} td.invalid{border-radius:0!important}
${M} .pill{border-radius:0!important}
#v266-barra{border-radius:0!important}
${A} .v123-header input,${A} .v123-header select{border-radius:0!important}
`;
  const st=document.createElement('style');st.id='v268-design';st.textContent=css;document.head.appendChild(st);
  window.classificadorV268={direcao:'Carbon + TaxAdvice'};
  window.V268_CARREGADO=true;
})();
