/* V220 — Tema azul-escuro na consulta NCM/NBS e impressão compacta com data de geração. */
(function(){
  const formatarData=()=>new Date().toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
  function aplicarData(){
    const painel=document.getElementById('v153-result'),resumo=painel?.querySelector('.v162-resumo');
    if(!resumo||resumo.querySelector('.v220-geracao'))return;
    const campo=document.createElement('div');
    campo.className='v220-geracao';
    campo.innerHTML='<span>Data de geração do arquivo</span><b>'+formatarData()+'</b>';
    resumo.insertBefore(campo,resumo.firstChild);
  }
  window.classificadorAplicarDataGeracao=aplicarData;
  const css=document.createElement('style');
  css.textContent=`
    body.v219-modo-consulta{background:#0b2a43!important}
    body.v219-modo-consulta #v123-topbar{background:#0e3657!important;border-bottom-color:#315f80!important;box-shadow:0 3px 12px #05182766}
    body.v219-modo-consulta #v123-topbar .v123-page-title{color:#fff!important}
    body.v219-modo-consulta #v123-topbar .v123-query{background:#123f62!important;border-color:#4f7f9f!important;box-shadow:0 1px 4px #061b2a66}
    body.v219-modo-consulta #v123-topbar .v123-query b{background:#082c48!important;color:#fff!important}
    body.v219-modo-consulta #v123-topbar .v123-query input{background:#eaf3f9!important;color:#050505!important;font-weight:700!important}
    body.v219-modo-consulta #v123-topbar .v123-query input::placeholder{color:#171717!important;opacity:1!important;font-weight:600!important}
    body.v219-modo-consulta #v123-topbar .v123-query button{background:#1a608e!important;color:#fff!important}
    body.v219-modo-consulta #v123-topbar .v123-clear{background:#f26a21!important;color:#fff!important}
    body.v219-modo-consulta #v153-result.v162-result{background:#0e3657!important;border-color:#3d7398!important;color:#fff!important;box-shadow:0 8px 24px #03142066}
    body.v219-modo-consulta #v153-result .v194-ficha,
    body.v219-modo-consulta #v153-result .v162-resumo>div,
    body.v219-modo-consulta #v153-result .v162-candidato,
    body.v219-modo-consulta #v153-result .v162-calc,
    body.v219-modo-consulta #v153-result .v162-final,
    body.v219-modo-consulta #v153-result .v217-is{background:#eaf3f9!important;color:#101820!important;border-color:#9bb8cc!important}
    body.v219-modo-consulta #v153-result .v194-ficha h3,
    body.v219-modo-consulta #v153-result .v194-ficha h4,
    body.v219-modo-consulta #v153-result .v162-candidato h3,
    body.v219-modo-consulta #v153-result .v162-calc h3,
    body.v219-modo-consulta #v153-result .v217-is h3{color:#0e3657!important}
    body.v219-modo-consulta #v153-result .v162-resumo span,
    body.v219-modo-consulta #v153-result .v162-resumo b,
    body.v219-modo-consulta #v153-result .v162-calc label,
    body.v219-modo-consulta #v153-result .v162-final span,
    body.v219-modo-consulta #v153-result .v162-final strong,
    body.v219-modo-consulta #v153-result .v162-final small{color:#101820!important}
    body.v219-modo-consulta #v153-result .v162-calc input{background:#fff!important;color:#000!important;border-color:#6f93aa!important}
    @media print{
      @page{size:A4 portrait;margin:8mm}
      #v153-result.v162-result{padding:5mm!important;font-size:9px!important}
      #v153-result .v220-geracao{order:-1!important}
      #v153-result .v162-resumo{grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:4px!important;margin:5px 0!important}
      #v153-result .v162-resumo>div{padding:4px 5px!important;min-height:0!important}
      #v153-result .v162-resumo span{font-size:6.8px!important;line-height:1.05!important;margin-bottom:2px!important}
      #v153-result .v162-resumo b{font-size:8px!important;line-height:1.1!important}
      #v153-result .v162-calc{display:block!important;margin:5px 0!important;padding:5px!important;border-radius:4px!important;break-inside:avoid!important;page-break-inside:avoid!important}
      #v153-result .v162-calc h3{margin:0 0 2px!important;font-size:10px!important;line-height:1.05!important}
      #v153-result .v162-calc>p{margin:0 0 4px!important;font-size:7px!important;line-height:1.1!important}
      #v153-result .v162-calc .v159-calc-grid{display:grid!important;grid-template-columns:repeat(5,minmax(0,1fr))!important;gap:4px!important;align-items:stretch!important}
      #v153-result .v162-calc label,#v153-result .v162-final{box-sizing:border-box!important;min-height:0!important;margin:0!important;padding:4px!important;font-size:6.8px!important;line-height:1.05!important;border:1px solid #9aa8b2!important;border-radius:3px!important;background:#fff!important;color:#111!important}
      #v153-result .v162-calc label{display:grid!important;grid-template-columns:1fr auto!important;align-items:center!important;gap:2px!important}
      #v153-result .v162-calc label input{width:35px!important;height:18px!important;margin:0!important;padding:1px 2px!important;font-size:8px!important;color:#000!important;background:#fff!important}
      #v153-result .v162-calc label small{grid-column:1/-1!important;margin:1px 0 0!important;font-size:6px!important;line-height:1!important}
      #v153-result .v162-final span{font-size:6.8px!important;line-height:1!important}
      #v153-result .v162-final strong{display:block!important;margin:2px 0!important;font-size:10px!important;line-height:1!important}
      #v153-result .v162-final small{font-size:5.8px!important;line-height:1!important}
    }
  `;
  document.head.appendChild(css);
  new MutationObserver(aplicarData).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',()=>setTimeout(aplicarData,0),true);
  aplicarData();
})();
