/* V147 — Remove visualmente os campos de mês e ano processados da tela inicial. */
(function(){
  const style=document.createElement('style');
  style.textContent=`
    .v123-header .process-fields{display:none!important}
  `;
  document.head.appendChild(style);
})();
