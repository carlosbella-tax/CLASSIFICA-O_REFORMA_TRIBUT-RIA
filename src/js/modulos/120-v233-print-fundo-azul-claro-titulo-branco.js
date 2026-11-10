/* V233 — Na impressão em PDF do modo consulta: fundo da página azul mais claro e título "TaxAdvice — Assessoria Fiscal Tributária" em branco. */
(function(){
  const css=document.createElement('style');
  css.id='v233-print-fundo-azul-claro-titulo-branco';
  css.textContent=`
    @media print{
      body.v219-modo-consulta,
      body.v219-modo-consulta #items{
        background:#eaf2f8!important;
        -webkit-print-color-adjust:exact!important;
        print-color-adjust:exact!important;
      }
      body.v219-modo-consulta .v153-result:before,
      body.v219-modo-consulta #v153-result:before{
        content:'TaxAdvice — Assessoria Fiscal Tributária'!important;
        color:#fff!important;
        -webkit-print-color-adjust:exact!important;
        print-color-adjust:exact!important;
      }
      body.v219-modo-consulta .v166-print-brand,
      body.v219-modo-consulta .v166-print-brand *{
        color:#fff!important;
        -webkit-print-color-adjust:exact!important;
        print-color-adjust:exact!important;
      }
    }
  `;
  document.head.appendChild(css);
  window.classificadorPrintFundoAzulClaroTituloBranco=true;
})();
