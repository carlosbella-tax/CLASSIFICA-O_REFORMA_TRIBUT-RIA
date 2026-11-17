/* V248/V251 — Aba NFS-e: quando o documento fiscal não tem NBS, campo para digitar a NBS; ao informar,
   carrega a regra da NBS com a correlação do serviço (Anexo VIII — LC 214/2025), grava a NBS e o código
   do serviço nos dados da análise da nota e segue para a aba Enquadramento recomendado. */
(function(){
  const issPanel=document.getElementById('iss');
  if(!issPanel)return;
  const base=(typeof ANEXO_VIII_CORRELACAO!=='undefined')?ANEXO_VIII_CORRELACAO:[];

  const css=document.createElement('style');css.id='v248-nbs-style';css.textContent=`
    .v248-nbs-box{margin:14px 0;padding:14px;border:1px solid #9dc5db;border-radius:8px;background:#f4f9fd}
    .v248-nbs-box h3{margin:0 0 8px!important;color:#123d60;font-size:15px!important}
    .v248-nbs-input{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
    .v248-nbs-input input{flex:1;min-width:180px;max-width:320px;padding:9px 11px;border:1px solid #9eb4c3;border-radius:7px;font:14px system-ui;background:#fff;color:#173f64}
    .v248-nbs-input button{border:0;border-radius:8px;padding:10px 18px;background:#0e5b91;color:#fff;font-weight:800;cursor:pointer}
    .v248-nbs-resultado{margin-top:10px}
    .v248-nbs-resultado table{width:100%;border-collapse:collapse;font-size:12px;background:#fff;border-radius:6px;overflow:hidden}
    .v248-nbs-resultado th{background:#ffd5bd;color:#5a2c08;text-align:left;padding:6px 8px}
    .v248-nbs-resultado td{padding:6px 8px;border-top:1px solid #e5edf2;color:#173f64;vertical-align:top}
    .v248-nbs-resultado .v248-nbs-cod{font-weight:800;color:#0e5b91;white-space:nowrap}
    .v248-nbs-aviso{margin-top:8px;padding:8px 10px;border-radius:6px;background:#fff5df;color:#6f4a05;font-size:12px;font-weight:600}
    .v248-nbs-vazio{margin-top:8px;color:#76500a;font-weight:700;font-size:12px}
    .v248-nbs-ok{margin-top:8px;padding:8px 10px;border-radius:6px;background:#e8f6ed;color:#17683a;font-size:12px;font-weight:700}
  `;document.head.appendChild(css);

  let montado=false;
  const garantirPainel=function(){
    if(montado&&document.getElementById('v248-nbs-box'))return;
    let box=issPanel.querySelector('.v248-nbs-box');
    if(!box){
      box=document.createElement('div');box.className='v248-nbs-box';box.id='v248-nbs-box';
      box.innerHTML='<h3>Correlação NBS × Serviço — LC 214/2025 (Anexo VIII)</h3>'+
        '<p style="margin:0 0 8px;color:#4c6272;font-size:12px">Se a NFS-e não trouxer a NBS, informe o código abaixo para carregar a regra tributária do serviço e aplicá-la aos itens da nota.</p>'+
        '<div class="v248-nbs-input"><input id="v248-nbs-campo" placeholder="Ex.: 1.1502.20.00 ou 01.06" inputmode="text"><button type="button" id="v248-nbs-buscar">Consultar regra</button></div>'+
        '<div class="v248-nbs-resultado" id="v248-nbs-resultado" hidden></div>';
      const alvo=document.getElementById('v153-result');
      if(alvo&&issPanel.contains(alvo))alvo.insertAdjacentElement('beforebegin',box);else issPanel.insertAdjacentElement('afterbegin',box);
    }
    montado=true;
  };

  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const normalizar=function(v){return String(v||'').replace(/\D/g,'')};

  /* busca na base: NBS completa, prefixo, ou código de serviço da LC 116 */
  window.classificadorV248BuscarCorrelacao=function(bruto){
    const digitos=normalizar(bruto);
    let itens=[];
    if(digitos.length>=7){
      itens=base.filter(x=>normalizar(x.nbs)===digitos);
      if(!itens.length)itens=base.filter(x=>normalizar(x.nbs).startsWith(digitos.slice(0,7)));
    }
    if(!itens.length)itens=base.filter(x=>normalizar(x.codigo)===digitos||x.codigo.replace(/\D/g,'')===digitos);
    if(!itens.length&&bruto&&bruto.length<=6)itens=base.filter(x=>x.codigo===bruto.trim());
    const vistos=new Set,unicos=[];
    itens.forEach(x=>{const k=normalizar(x.nbs)+'|'+x.cClassTrib;if(!vistos.has(k)){vistos.add(k);unicos.push(x)}});
    return unicos;
  };

  /* grava a NBS e o código do serviço nos itens NFS-e carregados (dados da análise da nota) */
  window.classificadorV248AplicarNbsAsItens=function(bruto,correlacoes){
    return window.classificadorV251AplicarConsulta?.(bruto,correlacoes)||0;
  };

  const buscar=function(){
    const campo=document.getElementById('v248-nbs-campo'),saida=document.getElementById('v248-nbs-resultado');
    if(!campo||!saida)return;
    const bruto=campo.value.trim();
    if(!bruto){saida.hidden=false;saida.innerHTML='<div class="v248-nbs-vazio">Informe a NBS ou o código do serviço.</div>';return}
    const unicos=window.classificadorV248BuscarCorrelacao(bruto);
    if(!unicos.length){
      saida.hidden=false;
      saida.innerHTML='<div class="v248-nbs-aviso">Nenhuma correlação encontrada para <b>'+esc(bruto)+'</b> no Anexo VIII. Confirme o código na tabela oficial da LC 214/2025.</div>';
      return;
    }
    saida.hidden=false;
    saida.innerHTML='<table><thead><tr><th>NBS</th><th>Descrição</th><th>Serviço (LC 116)</th><th>Local de incidência</th><th>cClassTrib</th><th>Regra IBS/CBS</th></tr></thead><tbody>'+
      unicos.map(x=>'<tr><td class="v248-nbs-cod">'+esc(x.nbs)+'</td><td>'+esc(x.nbsDesc||'—')+'</td><td>'+esc(x.codigo)+' — '+esc(x.servico||'—')+'</td><td>'+esc(x.local||'—')+'</td><td class="v248-nbs-cod">'+esc(x.cClassTrib)+'</td><td>'+esc(x.cClassTribNome||'—')+'</td></tr>').join('')+
      '</tbody></table>'+(unicos.some(x=>x.indop&&x.indop!=='NaN')?'<div class="v248-nbs-aviso">INDOP aplicável: '+esc([...new Set(unicos.map(x=>x.indop).filter(i=>i&&i!=='NaN'))].join(', '))+' — verifique o local da incidência.</div>':'');
    /* grava nos itens da nota e segue para o Enquadramento recomendado */
    const aplicados=window.classificadorV248AplicarNbsAsItens(bruto,unicos);
    const existentes=typeof state!=='undefined'?(state.items||[]).filter(r=>window.classificadorV251EhNfse?.(r)&&normalizar(r.dados_nfse?.nbs||r.nbs||r.codigo_nbs)===normalizar(bruto)).length:0;
    if(aplicados||existentes){
      const aviso=document.createElement('div');aviso.className='v248-nbs-ok';
      aviso.textContent=(aplicados?'NBS '+unicos[0].nbs+' aplicada a '+aplicados+' item(ns) da nota. ':'NBS já informada na nota, preservada. ')+'Abrindo Enquadramento recomendado…';
      saida.insertAdjacentElement('beforeend',aviso);
      setTimeout(function(){
        if(typeof window.renderAba==='function')window.renderAba('iss');
        const tab=document.querySelector('.tab[data-tab="observacoes"]');
        if(tab)tab.click();
      },700);
    }else{
      const aviso=document.createElement('div');aviso.className='v248-nbs-aviso';
      aviso.textContent='Nenhum item alterado: use uma NBS completa de 9 dígitos e confirme a compatibilidade com o código de serviço. NBS já informada é preservada; correlações ambíguas não são escolhidas automaticamente.';
      saida.appendChild(aviso);
    }
  };

  document.addEventListener('click',function(e){
    if(e.target&&e.target.id==='v248-nbs-buscar'){buscar()}
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target&&e.target.id==='v248-nbs-campo'){e.preventDefault();buscar()}
  });

  const obs=new MutationObserver(()=>{if(document.getElementById('iss').classList.contains('active'))garantirPainel()});
  obs.observe(issPanel,{childList:true,subtree:true});
  issPanel.addEventListener('click',garantirPainel);
})();
