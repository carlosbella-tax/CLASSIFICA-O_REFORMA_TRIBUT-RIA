/* V146 — Mantém os campos e botões de consulta NBS/NCM integralmente visíveis. */
(function(){
  const style=document.createElement('style');
  style.textContent=`
#v123-topbar{gap:14px!important}
.v123-searches{margin-left:0!important;min-width:0!important;flex:1 1 auto!important;justify-content:flex-end!important;gap:8px!important}
.v123-searches .v139-free-note{display:none!important}
.v123-query{min-width:0!important;flex:1 1 0!important;max-width:430px!important}
.v123-query input{min-width:0!important;width:100%!important;flex:1 1 auto!important}
.v123-query button{flex:0 0 auto!important;white-space:nowrap!important}
.v123-clear{flex:0 0 auto!important;white-space:nowrap!important}
@media(max-width:1280px) and (min-width:1001px){#v123-topbar{padding:0 18px!important}.v123-page-title{font-size:16px!important}.v123-query b{padding:0 10px!important}.v123-query input{padding:0 9px!important}.v123-query button{padding:0 10px!important}.v123-clear{padding:0 12px!important}}
`;
  document.head.appendChild(style);
})();
