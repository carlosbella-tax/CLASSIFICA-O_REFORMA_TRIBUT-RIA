/* V221 — Limpeza após a consulta NBS, campos compactos e isolamento reforçado da Consulta NCM/NBS. */
(function(){
  const top=document.getElementById('v123-topbar'),buscas=top?.querySelector('.v123-searches'),nbs=document.getElementById('v123-nbs'),ncm=document.getElementById('v123-ncm'),limpar=document.getElementById('v123-clear');
  if(!top||!buscas||!nbs||!ncm||!limpar)return;

  const grupoNbs=nbs.closest('.v123-query'),grupoNcm=ncm.closest('.v123-query');
  grupoNbs?.classList.add('v221-query-nbs');
  grupoNcm?.classList.add('v221-query-ncm');
  if(grupoNbs)grupoNbs.insertAdjacentElement('afterend',limpar);
  limpar.innerHTML='<span class="v221-clear-icon" aria-hidden="true">×</span><span>Limpar</span>';
  limpar.setAttribute('aria-label','Limpar todos os campos da consulta NBS e NCM');
  limpar.title='Limpar todos os campos da consulta NBS e NCM';

  function limparConsulta(){
    [nbs,ncm].forEach(campo=>{
      campo.value='';
      campo.dispatchEvent(new Event('input',{bubbles:true}));
      campo.dispatchEvent(new Event('change',{bubbles:true}));
    });
    document.getElementById('v153-result')?.remove();
    document.querySelectorAll('.v217-is-consulta,.v163-validacao-consulta,.v170-nbs-print').forEach(elemento=>elemento.remove());
    const titulo=document.getElementById('v123-title');
    if(titulo)titulo.textContent='Consulta NCM e NBS';
    window.classificadorModoConsultaNcmNbs?.(true);
    nbs.focus();
  }
  limpar.onclick=limparConsulta;
  window.classificadorLimparConsultaNcmNbs=limparConsulta;

  const css=document.createElement('style');
  css.textContent=`
    #v123-topbar .v123-searches{display:none!important}
    body.v219-modo-consulta #v123-topbar .v123-searches{display:flex!important;margin-left:auto!important;gap:7px!important;align-items:center!important;min-width:0!important}
    body.v219-modo-consulta #v123-topbar{gap:14px!important}
    body.v219-modo-consulta #v123-topbar .v123-page-title{flex:0 1 auto!important;min-width:170px!important;overflow:hidden!important;text-overflow:ellipsis!important}
    body.v219-modo-consulta #v123-topbar .v123-query{flex:0 1 auto!important;min-width:0!important}
    body.v219-modo-consulta #v123-topbar .v123-query input{min-width:0!important;width:165px!important}
    body.v219-modo-consulta #v123-topbar #v123-nbs{width:190px!important}
    body.v219-modo-consulta #v123-topbar #v123-ncm{width:155px!important}
    body.v219-modo-consulta #v123-topbar .v123-query button{padding:0 11px!important}
    body.v219-modo-consulta #v123-topbar .v123-clear{order:2!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;height:41px!important;padding:0 10px!important;white-space:nowrap!important}
    body.v219-modo-consulta #v123-topbar .v221-query-nbs{order:1!important}
    body.v219-modo-consulta #v123-topbar .v221-query-ncm{order:3!important}
    .v221-clear-icon{display:inline-grid;place-items:center;width:18px;height:18px;border:1.5px solid currentColor;border-radius:50%;font:900 16px/14px Arial,sans-serif}
    body.v219-modo-consulta header.v123-header,
    body.v219-modo-consulta .panel,
    body.v219-modo-consulta #v125-contact{display:none!important}
    body.v219-modo-consulta #v153-result{display:block!important;margin:96px 29px 18px!important}
    body:not(.v219-modo-consulta) header.v123-header{display:block!important}
    body:not(.v219-modo-consulta) .v123-header .company-fields{visibility:visible!important;opacity:1!important}
    @media(max-width:1180px){
      body.v219-modo-consulta #v123-topbar{padding-left:18px!important;padding-right:18px!important;gap:8px!important}
      body.v219-modo-consulta #v123-topbar .v123-page-title{min-width:135px!important;font-size:17px!important}
      body.v219-modo-consulta #v123-topbar #v123-nbs{width:155px!important}
      body.v219-modo-consulta #v123-topbar #v123-ncm{width:130px!important}
      body.v219-modo-consulta #v123-topbar .v123-query button{padding:0 8px!important}
    }
  `;
  document.head.appendChild(css);
})();
