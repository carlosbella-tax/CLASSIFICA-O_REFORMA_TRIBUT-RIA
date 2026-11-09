/* V226 — Remove da barra lateral o campo “Exportar esta aba em Excel”. */
(function(){
  const remover=()=>document.getElementById('v183-exportar-cte')?.remove();
  remover();
  /* V226 — Impede a recriação do controle por atualizações assíncronas dos contadores e painéis. */
  const lateral=document.getElementById('v123-sidebar');
  if(lateral)new MutationObserver(remover).observe(lateral,{childList:true,subtree:true});
  const css=document.createElement('style');
  css.id='v226-remocao-exportar-style';
  css.textContent='/* V226 — Proteção visual enquanto uma atualização assíncrona é processada. */#v183-exportar-cte{display:none!important}';
  document.head.appendChild(css);
  window.classificadorRemoverExportarAbaMenu=remover;
})();
