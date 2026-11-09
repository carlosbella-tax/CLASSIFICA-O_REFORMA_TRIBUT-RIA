/* V228 — Mantém em branco, na impressão em PDF, todo o texto de fonte e critério documental da consulta. */
(function(){
  const css=document.createElement('style');
  css.id='v228-fonte-consulta-branca-impressao';
  css.textContent=`
    @media print{
      body.v219-modo-consulta #v153-result .v153-source,
      body.v219-modo-consulta #v153-result .v153-source *{
        color:#fff!important;
        -webkit-print-color-adjust:exact!important;
        print-color-adjust:exact!important;
      }
    }
  `;
  document.head.appendChild(css);
  window.classificadorFonteConsultaBrancaImpressao=true;
})();
