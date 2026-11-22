/* V264 — Quadro "Apuração" na tela Apuração assistida da CBS: montante dos débitos, montante dos créditos e
   valor apurado (débitos − créditos), por período ou no total. Usa a apuração prévia da V256 (mesmos
   documentos e mesmos valores da tabela por período); não cria regra de cálculo nova.
   Quando há JSON da Receita importados, mostra ao lado os montantes apurados pela Receita e a diferença. */
(function(){
  if (window.V264_CARREGADO) return;
  const V256=window.classificadorV256,sec=document.getElementById('apuracaocbs');if(!V256||!sec)return;
  const n2=v=>Math.round((Number(v)||0)*100)/100;
  const real=v=>'R$ '+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const resultado=v=>v>0?'CBS a recolher':v<0?'Saldo credor':'Zerado';

  /* Soma a apuração prévia (ap) no período escolhido; pa vazio = todos os períodos. */
  function apurar(ap,co,pa){
    const r={pa:pa||'',debitos:0,creditos:0,debitosDestacados:0,creditosDestacados:0,docsDebito:0,docsCredito:0,foraDaApuracao:0,emRevisao:0,receita:null};
    for(const d of (ap&&ap.documentos)||[]){
      if(!d.lado||!d.pa){if(!pa)r.foraDaApuracao++;continue}
      if(pa&&d.pa!==pa)continue;
      if(d.lado==='debitos'){r.debitos+=d.cbs;r.debitosDestacados+=d.cbsDestacada;r.docsDebito++}else{r.creditos+=d.cbs;r.creditosDestacados+=d.cbsDestacada;r.docsCredito++}
      if(d.revisao)r.emRevisao++;
    }
    for(const k of ['debitos','creditos','debitosDestacados','creditosDestacados'])r[k]=n2(r[k]);
    r.debitosEstimados=n2(r.debitos-r.debitosDestacados);r.creditosEstimados=n2(r.creditos-r.creditosDestacados);
    r.valor=n2(r.debitos-r.creditos);r.resultado=resultado(r.valor);
    const linhas=((co&&co.linhas)||[]).filter(l=>l.cbsReceita!==null&&l.cbsReceita!==undefined&&(!pa||l.pa===pa));
    if(linhas.length){
      const rec={debitos:0,creditos:0};for(const l of linhas)if(l.lado==='debitos'||l.lado==='creditos')rec[l.lado]+=Number(l.cbsReceita)||0;
      rec.debitos=n2(rec.debitos);rec.creditos=n2(rec.creditos);rec.valor=n2(rec.debitos-rec.creditos);rec.resultado=resultado(rec.valor);rec.diferenca=n2(r.valor-rec.valor);r.receita=rec;
    }
    return r;
  }

  const st=document.createElement('style');st.id='v264-apuracao-style';st.textContent=`
#v264-apuracao .v264-topo{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
#v264-apuracao .v264-topo label{font:600 12px system-ui;color:#42566B}
#v264-apuracao select{min-width:190px}
.v264-grade{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.v264-q{border:1px solid #DCE3EE;border-top:4px solid #2456C8;border-radius:8px;padding:12px 14px;background:#fff}
.v264-q.cred{border-top-color:#15803D}.v264-q.res{border-top-color:#0F2A4A;background:#F4F7FB}.v264-q.res.recolher{border-top-color:#B45309}.v264-q.res.credor{border-top-color:#15803D}
.v264-q span{display:block;font:600 11px system-ui;color:#5B6B7C;text-transform:uppercase;letter-spacing:.05em}
.v264-q b{display:block;margin:4px 0 2px;font:700 24px system-ui;color:#0F2A4A;font-variant-numeric:tabular-nums}
.v264-q small{display:block;font:12px/1.5 system-ui;color:#42566B}
.v264-q em{display:inline-block;margin-top:4px;padding:1px 9px;border-radius:999px;font:700 11px system-ui;font-style:normal;background:#E6EEFC;color:#1F3F8F}
.v264-q.recolher em{background:#FFF3DA;color:#8A5A06}.v264-q.credor em{background:#E2F4E2;color:#1C6B1C}
#v264-notas{margin-top:10px}#v264-notas p{margin:3px 0;font:12.5px system-ui;color:#42566B}
#v264-receita{margin-top:12px}#v264-receita table td,#v264-receita table th{text-align:right}#v264-receita table td:first-child,#v264-receita table th:first-child{text-align:left}`;
  document.head.appendChild(st);
  const card=document.createElement('div');card.className='card';card.id='v264-apuracao';
  card.innerHTML='<div class="v264-topo"><b class="v256-t" style="font-size:16px;margin:0">Apuração da CBS</b><label for="v264Periodo">Período de apuração</label><select id="v264Periodo"><option value="">Todos os períodos</option></select></div>'
    +'<div id="v264Corpo"></div><div id="v264-receita"></div><div id="v264-notas"></div>';
  const primeiro=sec.querySelector(':scope > .card');
  if(primeiro)primeiro.insertAdjacentElement('afterend',card);else sec.insertBefore(card,sec.firstChild);
  const sel=card.querySelector('#v264Periodo');
  let assinatura='';
  function render(forcar){
    const itens=(typeof state!=='undefined'&&state.items)||[],rc=V256.estado.receita;
    const ass=[itens.length,rc.debitos.size,rc.creditos.size,sel.value].join('|');
    if(!forcar&&ass===assinatura)return;assinatura=ass;
    const ap=V256.previa(itens),co=V256.conciliar(ap);
    const pas=ap.periodos.map(p=>p.pa),atual=pas.includes(sel.value)?sel.value:'';
    sel.innerHTML='<option value="">Todos os períodos</option>'+pas.map(p=>'<option value="'+esc(p)+'">'+esc(p)+'</option>').join('');sel.value=atual;
    const corpo=card.querySelector('#v264Corpo'),notas=card.querySelector('#v264-notas'),rec=card.querySelector('#v264-receita');
    if(!ap.periodos.length){corpo.innerHTML='<p class="empty">Carregue e processe XML, PDF, SPED Fiscal ou EFD Contribuições para ver o montante dos débitos, dos créditos e o valor apurado.</p>';notas.innerHTML='';rec.innerHTML='';return}
    const a=apurar(ap,co,atual),cls=a.valor>0?'recolher':a.valor<0?'credor':'';
    corpo.innerHTML='<div class="v264-grade">'
      +'<div class="v264-q deb"><span>Montante dos débitos</span><b id="v264Debitos">'+real(a.debitos)+'</b><small>'+a.docsDebito+' documento(s) de saída</small><small>Destacado: '+real(a.debitosDestacados)+' · Estimado: '+real(a.debitosEstimados)+'</small></div>'
      +'<div class="v264-q cred"><span>Montante dos créditos</span><b id="v264Creditos">'+real(a.creditos)+'</b><small>'+a.docsCredito+' documento(s) de entrada</small><small>Destacado: '+real(a.creditosDestacados)+' · Estimado: '+real(a.creditosEstimados)+'</small></div>'
      +'<div class="v264-q res '+cls+'"><span>Valor apurado (débitos − créditos)</span><b id="v264Valor">'+real(Math.abs(a.valor))+'</b><em id="v264Resultado">'+a.resultado+'</em><small>'+(atual?'Período '+esc(atual):'Soma de '+ap.periodos.length+' período(s)')+'</small></div></div>';
    rec.innerHTML=a.receita?'<div class="table-wrap"><table id="v264ReceitaTable"><thead><tr><th>Origem</th><th>Débitos</th><th>Créditos</th><th>Valor apurado</th><th>Resultado</th></tr></thead><tbody>'
      +'<tr><td>Arquivos carregados na ferramenta</td><td>'+real(a.debitos)+'</td><td>'+real(a.creditos)+'</td><td>'+real(Math.abs(a.valor))+'</td><td>'+a.resultado+'</td></tr>'
      +'<tr><td>JSON da Receita Federal (apurado, sem ajustes)</td><td>'+real(a.receita.debitos)+'</td><td>'+real(a.receita.creditos)+'</td><td>'+real(Math.abs(a.receita.valor))+'</td><td>'+a.receita.resultado+'</td></tr>'
      +'<tr><td><b>Diferença (ferramenta − Receita)</b></td><td>'+real(n2(a.debitos-a.receita.debitos))+'</td><td>'+real(n2(a.creditos-a.receita.creditos))+'</td><td><b>'+real(a.receita.diferenca)+'</b></td><td>'+(Math.abs(a.receita.diferenca)<=0.01?'Confere':'Conferir na conciliação por documento')+'</td></tr></tbody></table></div>':'';
    const n=[];
    if(a.debitosEstimados||a.creditosEstimados)n.push('Parte do valor é <b>estimativa</b>: documentos sem CBS destacada foram calculados pelo cronograma (CBS do ano × base, com a redução do enquadramento). O valor definitivo é o apurado pela Receita Federal.');
    if(a.emRevisao)n.push(a.emRevisao+' documento(s) têm NCM com enquadramento em revisão; a estimativa deles não aplica redução.');
    if(a.foraDaApuracao)n.push(a.foraDaApuracao+' documento(s) ficaram fora do cálculo por não ter a operação (entrada ou saída) ou a data de emissão identificada.');
    if(!atual&&ap.periodos.length>1)n.push('No total, o saldo credor de um período compensa o valor a recolher de outro. Escolha um período para ver a apuração dele isolada.');
    if(!a.receita)n.push('Importe os JSON da Receita Federal (item 2, abaixo) para comparar com os montantes apurados por ela.');
    notas.innerHTML=n.map(x=>'<p>'+x+'</p>').join('');
  }
  sel.addEventListener('input',()=>render(true));
  const anterior=window.renderAba;
  if(typeof anterior==='function')window.renderAba=function(id){const r=anterior(id);if(id==='apuracaocbs')render(true);return r};
  document.addEventListener('click',()=>setTimeout(()=>{if(sec.classList.contains('active'))render()},120));
  setInterval(()=>{if(sec.classList.contains('active'))render()},1500);
  window.classificadorV264={apurar,render:()=>render(true)};
  window.V264_CARREGADO=true;
})();
