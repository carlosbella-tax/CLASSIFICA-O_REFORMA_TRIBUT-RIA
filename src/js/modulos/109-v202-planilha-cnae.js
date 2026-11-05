/* V202 — Atalho permanente para a planilha NCM/NBS e campo CNAE em toda a linha. */
(function(){
  const style=document.createElement('style');
  style.textContent='header .company-fields .v156-cnae-field{grid-column:1/-1!important;width:100%}header .company-fields .v156-cnae-field textarea{box-sizing:border-box;width:100%;min-height:52px}.v202-lote-link{border-color:#f26a21!important;color:#fff!important}';
  document.head.appendChild(style);
  const side=document.getElementById('v123-sidebar');
  if(!side||document.getElementById('v202-lote-link'))return;
  const link=document.createElement('button');
  link.id='v202-lote-link';link.type='button';link.className='v123-link v202-lote-link';
  link.innerHTML='Carregar Excel NCM / NBS <small>›</small>';
  link.onclick=e=>{e.preventDefault();e.stopPropagation();window.classificadorAbrirResultadoLote?.();};
  const referencia=[...side.querySelectorAll('.v123-link')].find(el=>/Consulta NCM/i.test(el.textContent));
  referencia?.insertAdjacentElement('afterend',link)||side.appendChild(link);
})();
