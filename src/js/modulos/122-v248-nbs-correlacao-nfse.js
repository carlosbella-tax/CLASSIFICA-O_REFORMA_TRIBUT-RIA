/* V248 — Aba NFS-e: quando o documento fiscal não tem NBS, campo para digitar a NBS; ao informar,
   carrega a regra da NBS com a correlação do serviço (Anexo VIII — LC 214/2025). */
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
  `;document.head.appendChild(css);

  /* O painel de NBS é injetado dentro da aba iss sempre que um resultado NFS-e é renderizado. */
  let montado=false;
  const garantirPainel=function(){
    if(montado&&document.getElementById('v248-nbs-box'))return;
    let box=issPanel.querySelector('.v248-nbs-box');
    if(!box){
      box=document.createElement('div');box.className='v248-nbs-box';box.id='v248-nbs-box';
      box.innerHTML='<h3>Correlação NBS × Serviço — LC 214/2025 (Anexo VIII)</h3>'+
        '<p style="margin:0 0 8px;color:#4c6272;font-size:12px">Se a NFS-e não trouxer a NBS, informe o código abaixo para carregar a regra tributária do serviço.</p>'+
        '<div class="v248-nbs-input"><input id="v248-nbs-campo" placeholder="Ex.: 1.1502.20.00 ou 01.06" inputmode="text"><button type="button" id="v248-nbs-buscar">Consultar regra</button></div>'+
        '<div class="v248-nbs-resultado" id="v248-nbs-resultado" hidden></div>';
      const alvo=issPanel.querySelector('#v153-result')||issPanel;
      alvo.insertAdjacentElement(issoAlvo(alvo),box);
    }
    montado=true;
  };
  const issoAlvo=function(alvo){return alvo.id==='v153-result'?'beforebegin':'afterbegin'};

  const normalizar=function(v){return String(v||'').replace(/\D/g,'')};
  const formatarNbs=function(d){const d8=d.padStart(9,'0');return d8.slice(0,1)+'.'+d8.slice(1,5)+'.'+d8.slice(5,7)+'.'+d8.slice(7)};

  const buscar=function(){
    const campo=document.getElementById('v248-nbs-campo'),saida=document.getElementById('v248-nbs-resultado');
    if(!campo||!saida)return;
    const bruto=campo.value.trim();
    if(!bruto){saida.hidden=false;saida.innerHTML='<div class="v248-nbs-vazio">Informe a NBS ou o código do serviço.</div>';return}
    const digitos=normalizar(bruto);
    let itens=[];
    /* busca pela NBS completa (9 dígitos), prefixo, ou código de serviço da LC 116 */
    if(digitos.length>=7){
      itens=base.filter(x=>normalizar(x.nbs)===digitos);
      if(!itens.length)itens=base.filter(x=>normalizar(x.nbs).startsWith(digitos.slice(0,7)));
    }
    if(!itens.length){
      itens=base.filter(x=>normalizar(x.codigo)===digitos||x.codigo.replace(/\D/g,'')===digitos);
    }
    if(!itens.length&&bruto.length<=6){
      itens=base.filter(x=>x.codigo===bruto);
    }
    if(!itens.length){
      saida.hidden=false;
      saida.innerHTML='<div class="v248-nbs-aviso">Nenhuma correlação encontrada para <b>'+esc(bruto)+'</b> no Anexo VIII. Confirme o código na tabela oficial da LC 214/2025.</div>';
      return;
    }
    /* deduplicar por nbs+cClassTrib */
    const vistos=new Set,unicos=[];
    itens.forEach(x=>{const k=normalizar(x.nbs)+'|'+x.cClassTrib;if(!vistos.has(k)){vistos.add(k);unicos.push(x)}});
    saida.hidden=false;
    saida.innerHTML='<table><thead><tr><th>NBS</th><th>Descrição</th><th>Serviço (LC 116)</th><th>Local de incidência</th><th>cClassTrib</th><th>Regra IBS/CBS</th></tr></thead><tbody>'+
      unicos.map(x=>'<tr><td class="v248-nbs-cod">'+esc(x.nbs)+'</td><td>'+esc(x.nbsDesc||'—')+'</td><td>'+esc(x.codigo)+' — '+esc(x.servico||'—')+'</td><td>'+esc(x.local||'—')+'</td><td class="v248-nbs-cod">'+esc(x.cClassTrib)+'</td><td>'+esc(x.cClassTribNome||'—')+'</td></tr>').join('')+
      '</tbody></table>'+(unicos.some(x=>x.indop&&x.indop!=='NaN')?'<div class="v248-nbs-aviso">INDOP aplicável: '+esc([...new Set(unicos.map(x=>x.indop).filter(i=>i&&i!=='NaN'))].join(', '))+' — verifique o local da incidência (interno ou exterior).</div>':'');
  };

  document.addEventListener('click',function(e){
    if(e.target&&e.target.id==='v248-nbs-buscar'){buscar();return}
    if(e.target&&e.target.id==='v248-nbs-campo'&&e.key==='Enter'){buscar()}
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target&&e.target.id==='v248-nbs-campo'){e.preventDefault();buscar()}
  });

  /* o painel acompanha os resultados NFS-e: observa a aba iss */
  const obs=new MutationObserver(()=>{if(document.getElementById('iss').classList.contains('active'))garantirPainel()});
  obs.observe(issPanel,{childList:true,subtree:true});
  issPanel.addEventListener('click',garantirPainel);
})();
