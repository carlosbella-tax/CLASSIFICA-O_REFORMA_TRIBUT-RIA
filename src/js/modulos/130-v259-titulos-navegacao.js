/* V259 — Título do cabeçalho nas telas criadas pela V253 (Análise por NCM e Fornecedores). */
(function(){
  if (window.V259_CARREGADO) return;
  const TITULOS={ncmanalise:'Análise por NCM — Reforma Tributária',fornecedores:'Fornecedores e clientes'};
  document.addEventListener('click',e=>{
    const b=e.target.closest&&e.target.closest('#v123-sidebar [data-v123-key]');
    const k=b&&b.dataset.v123Key;if(!k||!TITULOS[k])return;
    setTimeout(()=>{const t=document.getElementById('v123-title');if(t&&b.classList.contains('active'))t.textContent=TITULOS[k]},0);
  });
  window.V259_CARREGADO=true;
})();
