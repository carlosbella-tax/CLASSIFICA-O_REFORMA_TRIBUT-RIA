/* V254 — Alinhamento com o Motor de Cálculo: quando o Motor e o Classificador apontam anexos
   diferentes da LC 214/2025 para o mesmo NCM, a análise mostra os dois enquadramentos,
   marca revisão obrigatória e não aplica redução de alíquota. */
(function(){
  const base=()=>window.V254_DIVERGENCIAS_MOTOR_NCM||{};
  const semCalculo={valor:null,texto:'A confirmar — Motor e Classificador divergem'};
  function divergencia(r,d){
    r=r||{};if(!d||window.classificadorV251EhNfse?.(r))return d;
    const ncm=String(r.ncm||'').replace(/\D/g,'');if(ncm.length!==8||!Object.prototype.hasOwnProperty.call(base(),ncm))return d;
    const motor=base()[ncm]||[];
    const classif=[...new Set((d.legais||[]).flatMap(x=>[...String(x.anexo||'').matchAll(/Anexo ([IVX]+)/g)].map(y=>y[1])))];
    const motorTexto=motor.length?motor.map(a=>'Anexo '+a).join(' / '):'sem anexo';
    const classifTexto=classif.length?classif.map(a=>'Anexo '+a).join(' / '):'sem anexo';
    const texto='Motor: '+motorTexto+' · Classificador: '+classifTexto;
    return {...d,status:'REVISÃO NECESSÁRIA',cst:'—',classe:'—',
      mensagem:'Enquadramentos diferentes para o NCM '+ncm+' ('+texto+'). Revisão obrigatória; nenhuma redução aplicada. '+String(d.mensagem||''),
      reducao:'Revisão necessária — Motor e Classificador divergem',
      efetivas:{ibsMunicipal:semCalculo,ibsEstadual:semCalculo,cbs:semCalculo},
      divergenciaMotor:{ncm,motor,classificador:classif,motorTexto,classificadorTexto:classifTexto,texto}};
  }
  window.classificadorV254Divergencia=divergencia;
  window.V254_CARREGADO=true;
})();
