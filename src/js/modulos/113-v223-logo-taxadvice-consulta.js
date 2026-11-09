/* V223 — Restaura o logotipo TaxAdvice original no topo da tela de Consulta NCM/NBS. */
(function(){
  const lateral=document.getElementById('v123-sidebar'),marcaOriginal=document.querySelector('header.v123-header .brand');
  if(!lateral||!marcaOriginal||document.getElementById('v223-logo-consulta'))return;

  const marca=marcaOriginal.cloneNode(true);
  marca.id='v223-logo-consulta';
  marca.classList.add('v223-logo-consulta');
  marca.setAttribute('aria-label','TaxAdvice — Assessoria Fiscal Tributária');
  lateral.insertBefore(marca,lateral.firstChild);

  const css=document.createElement('style');
  css.textContent=`
    #v223-logo-consulta{display:none}
    body.v219-modo-consulta #v223-logo-consulta{position:absolute;z-index:22;left:16px;right:16px;top:18px;display:block;margin:0;padding:9px 12px;border-radius:8px;background:#fff;box-shadow:0 2px 7px #0004;text-align:left;font:700 27px Georgia,serif;color:#000}
    body.v219-modo-consulta #v223-logo-consulta .tax{color:#000}
    body.v219-modo-consulta #v223-logo-consulta .advice{color:#f26a21}
    body.v219-modo-consulta #v223-logo-consulta .tagline{display:block;width:auto;min-width:0;margin:3px 0 0;padding:0;border:0;color:#183a5b;font:500 10px system-ui,sans-serif;letter-spacing:.2px}
    @media(max-width:1000px){#v223-logo-consulta{display:none!important}}
    @media print{#v223-logo-consulta{display:none!important}}
  `;
  document.head.appendChild(css);
  window.classificadorLogoTaxAdviceConsulta=marca;
})();
