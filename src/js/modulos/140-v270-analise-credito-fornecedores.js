/* V270 — Análise de crédito de IBS e CBS por fornecedor, na aba Fornecedores e clientes.
   Separa os fornecedores em três grupos, por regras da LC 214/2025 aplicadas ao regime tributário, à situação
   cadastral e ao enquadramento dos itens comprados:
   • melhores para crédito (regime regular, cadastro sem restrição, itens tributados);
   • impacto negativo (Simples Nacional, MEI, pessoa física, cadastro irregular, itens com alíquota zero);
   • a analisar (regime não identificado ou informações conflitantes).
   O valor é o IBS + CBS de 2033 sobre as compras, com a redução do enquadramento de cada item (calculado na
   V253). É estimativa para priorizar a análise; não é apuração de crédito. Não altera dados. */
(function(){
  if (window.V270_CARREGADO) return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const real=v=>'R$ '+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v||0));
  const pct=v=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v||0))+'%';

  /* Regime do fornecedor a partir do texto montado pela V253/V265 (pode trazer mais de uma indicação, separadas por " | "). */
  function tipoRegime(regime){
    const t=new Set;
    for(const p of String(regime||'').split(' | ').map(s=>s.trim()).filter(Boolean)){
      if(/^Declarante do SPED|Não identificado|não tabelado/i.test(p))continue;
      if(/MEI/.test(p))t.add('mei');
      else if(/Não optante|Regime comum|CRT 3/i.test(p))t.add('regular');
      else if(/Simples/i.test(p))t.add('simples');
    }
    return !t.size?'indefinido':t.size>1?'conflito':[...t][0];
  }
  const cadastroIrregular=s=>/BAIXADA|INAPTA|SUSPENSA|NULA|inválido|não localizado/i.test(String(s||''));

  function classificar(r){
    const doc=String(r.cnpj||'').replace(/\D/g,''),potencial=Number(r.ibs_cbs_2033)||0,valor=Number(r.valor_total)||0,zero=Number(r.valor_aliquota_zero)||0,reg=tipoRegime(r.regime);
    const o={grupo:'analisar',motivo:'',acao:'',potencial,valor,regime:reg};
    if(cadastroIrregular(r.situacao)){o.grupo='negativo';o.motivo='Situação cadastral: '+r.situacao+'. Documento de fornecedor com cadastro irregular pode ser desconsiderado e o crédito, glosado.';o.acao='Suspender a tomada de crédito e exigir a regularização do cadastro ou trocar de fornecedor.';return o}
    if(doc.length===11){o.grupo='negativo';o.motivo='Pessoa física (CPF): em regra não é contribuinte de IBS e CBS, e a compra não gera crédito.';o.acao='Verificar se é produtor rural não contribuinte, caso em que há crédito presumido (LC 214/2025, arts. 168 e seguintes).';return o}
    if(reg==='mei'){o.grupo='negativo';o.motivo='MEI: o IBS e a CBS são recolhidos em valor fixo; o crédito transferido é irrisório.';o.acao='Avaliar o custo sem crédito na formação do preço ou comparar com fornecedor do regime regular.';return o}
    if(reg==='simples'){o.grupo='negativo';o.motivo='Simples Nacional: o crédito fica limitado ao IBS e à CBS recolhidos dentro do Simples, abaixo da alíquota cheia (LC 214/2025, art. 47).';o.acao='Perguntar se o fornecedor vai optar por recolher IBS e CBS pelo regime regular, o que devolve o crédito integral, ou renegociar o preço.';return o}
    if(reg==='regular'){
      if(valor>0&&potencial<=0){o.grupo='negativo';o.motivo='Regime regular, mas todos os itens comprados têm alíquota zero ou redução de 100%: não há IBS e CBS destacados para creditar.';o.acao='Sem ação sobre o fornecedor; considerar a ausência de crédito no custo desses itens.';return o}
      o.grupo='favoravel';o.motivo='Regime regular (Lucro Real ou Presumido): crédito integral do IBS e da CBS destacados no documento.'+(zero>0?' Parte das compras ('+real(zero)+') é de itens com alíquota zero, sem crédito.':'');
      o.acao='Manter; o crédito depende do pagamento do tributo pelo fornecedor ou do recolhimento na liquidação (LC 214/2025, art. 47).';return o}
    if(reg==='conflito'){o.motivo='Os documentos e o cadastro indicam regimes diferentes para o mesmo fornecedor.';o.acao='Confirmar o regime atual com o fornecedor antes de contar com o crédito.';return o}
    o.motivo='Regime tributário não identificado nos documentos nem no cadastro.';o.acao='Usar "Pesquisar empresas pelo CNPJ" ou confirmar o regime com o fornecedor.';return o;
  }

  function analisar(rows){
    const g={favoravel:[],negativo:[],analisar:[]};
    for(const r of rows||[]){
      if(!/^Fornecedor/.test(String(r.papel||'')))continue;
      const c=classificar(r);
      g[c.grupo].push(Object.assign({nome:r.razao_social&&r.razao_social!=='consultando…'?r.razao_social:r.nome_documento,cnpj:r.cnpj,regimeTexto:r.regime,participacao:r.participacao},c));
    }
    for(const k in g)g[k].sort((a,b)=>b.potencial-a.potencial||b.valor-a.valor);
    const tot=l=>({n:l.length,valor:l.reduce((a,x)=>a+x.valor,0),potencial:l.reduce((a,x)=>a+x.potencial,0)});
    return {grupos:g,total:{favoravel:tot(g.favoravel),negativo:tot(g.negativo),analisar:tot(g.analisar)}};
  }

  const st=document.createElement('style');st.id='v270-style';
  st.textContent='#v270-credito h3{margin:0 0 4px;font-size:17px;color:#0F2A4A}#v270-credito .v270-res{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:10px;margin:10px 0 14px}#v270-credito .v270-q{background:#fff;border:1px solid #E0E0E0;border-top:3px solid #198038;padding:9px 12px}#v270-credito .v270-q.neg{border-top-color:#DA1E28}#v270-credito .v270-q.ana{border-top-color:#F1C21B}#v270-credito .v270-q label{display:block;font:600 11px system-ui;color:#525252;text-transform:uppercase}#v270-credito .v270-q b{display:block;font:600 19px system-ui;color:#161616;font-variant-numeric:tabular-nums;margin:2px 0}#v270-credito .v270-q small{font-size:11px;color:#525252}#v270-credito h4{margin:14px 0 6px;font-size:14px;color:#0F2A4A}#v270-credito h4 span{font-weight:400;color:#525252;font-size:12px}#v270-credito table{width:100%}#v270-credito td{vertical-align:top;font-size:12px;white-space:normal!important;max-width:none!important;overflow:visible!important;text-overflow:clip!important}#v270-credito td:nth-child(1){min-width:150px}#v270-credito td:nth-child(2){white-space:nowrap!important}#v270-credito td:nth-child(3){min-width:150px}#v270-credito td.v270-n{text-align:right;white-space:nowrap!important;font-variant-numeric:tabular-nums}#v270-credito td.v270-t{min-width:200px}#v270-credito .v270-wrap{overflow:auto;border:1px solid #E0E0E0;max-height:340px}#v270-credito .v270-obs{font-size:11px;color:#525252;margin-top:10px}#v270-credito details summary{cursor:pointer;font-weight:600;color:#0F2A4A;margin-top:14px;font-size:14px}';
  document.head.appendChild(st);

  const LIMITE=50;
  function tabela(lista,rotulo){
    if(!lista.length)return '<p class="hint">Nenhum fornecedor neste grupo.</p>';
    return '<div class="v270-wrap"><table><thead><tr class="excel-header"><th>Fornecedor</th><th>CNPJ/CPF</th><th>Regime tributário</th><th>Compras</th><th>Participação</th><th>'+rotulo+'</th><th>Por quê</th><th>O que fazer</th></tr></thead><tbody>'
      +lista.slice(0,LIMITE).map(x=>'<tr><td><b>'+esc(x.nome||'—')+'</b></td><td>'+esc(x.cnpj)+'</td><td>'+esc(x.regimeTexto)+'</td><td class="v270-n">'+real(x.valor)+'</td><td class="v270-n">'+pct(x.participacao)+'</td><td class="v270-n"><b>'+real(x.potencial)+'</b></td><td class="v270-t">'+esc(x.motivo)+'</td><td class="v270-t">'+esc(x.acao)+'</td></tr>').join('')
      +'</tbody></table></div>'+(lista.length>LIMITE?'<p class="hint">Mostrando os '+LIMITE+' maiores de '+lista.length+'. A lista completa sai no Excel.</p>':'');
  }
  let ultima=null;
  function render(rows){
    const painel=document.getElementById('fornecedores');if(!painel)return null;
    let box=document.getElementById('v270-credito');
    if(!box){box=document.createElement('div');box.id='v270-credito';box.className='card';const primeiro=painel.querySelector('.card');if(primeiro)primeiro.insertAdjacentElement('afterend',box);else painel.appendChild(box)}
    const a=analisar(rows),t=a.total;ultima=a;
    if(!t.favoravel.n&&!t.negativo.n&&!t.analisar.n){box.hidden=true;return a}
    box.hidden=false;
    const det=box.querySelector('details'),aberto=!!(det&&det.open);
    box.innerHTML='<h3>Análise de crédito de IBS e CBS por fornecedor</h3><span class="hint">Classificação pelo regime tributário, pela situação cadastral e pelo enquadramento dos itens comprados. Valores: IBS + CBS de 2033 sobre as compras, com a redução de cada item.</span>'
      +'<div class="v270-res"><div class="v270-q"><label>Melhores para crédito</label><b>'+real(t.favoravel.potencial)+'</b><small>'+t.favoravel.n+' fornecedor(es) · compras de '+real(t.favoravel.valor)+'</small></div>'
      +'<div class="v270-q neg"><label>Crédito em risco</label><b>'+real(t.negativo.potencial)+'</b><small>'+t.negativo.n+' fornecedor(es) · compras de '+real(t.negativo.valor)+'</small></div>'
      +'<div class="v270-q ana"><label>A analisar</label><b>'+real(t.analisar.potencial)+'</b><small>'+t.analisar.n+' fornecedor(es) · compras de '+real(t.analisar.valor)+'</small></div></div>'
      +'<div class="actions"><button type="button" class="secondary" id="v270-exportar">⬇ Exportar análise de crédito</button></div>'
      +'<h4>Melhores fornecedores para crédito de IBS e CBS <span>— do maior crédito potencial para o menor</span></h4>'+tabela(a.grupos.favoravel,'Crédito potencial (2033)')
      +'<h4>Fornecedores com impacto negativo na tomada de crédito <span>— do maior valor em risco para o menor</span></h4>'+tabela(a.grupos.negativo,'Crédito em risco (2033)')
      +'<details'+(aberto?' open':'')+'><summary>Fornecedores a analisar ('+t.analisar.n+')</summary>'+tabela(a.grupos.analisar,'Crédito a confirmar (2033)')+'</details>'
      +'<p class="v270-obs">Estimativa para priorizar a análise, não apuração de crédito. "Crédito em risco" é o IBS + CBS que haveria se o fornecedor estivesse no regime regular; no Simples Nacional parte dele ainda é aproveitada, em valor que os documentos não permitem calcular. O crédito efetivo depende do pagamento do tributo e do uso do bem ou serviço na atividade. Confirme os artigos da LC 214/2025 antes de decidir.</p>';
    return a;
  }
  function linhasExcel(a){
    const nomes={favoravel:'Melhor para crédito',negativo:'Impacto negativo',analisar:'A analisar'},l=[];
    for(const k of ['favoravel','negativo','analisar'])for(const x of a.grupos[k])l.push({classificacao:nomes[k],fornecedor:x.nome,cnpj_cpf:x.cnpj,regime_tributario:x.regimeTexto,compras:x.valor,participacao:x.participacao,ibs_cbs_2033:x.potencial,por_que:x.motivo,o_que_fazer:x.acao});
    return l;
  }
  document.addEventListener('click',e=>{
    if(!e.target.closest('#v270-exportar')||!ultima)return;
    const l=linhasExcel(ultima);if(!l.length)return;
    if(typeof gerarXlsx==='function')gerarXlsx('ANALISE_CREDITO_FORNECEDORES_'+new Date().toISOString().slice(0,10)+'.xlsx',[['Crédito por fornecedor',typeof window.v253FormatarExport==='function'?window.v253FormatarExport(l):l]]);
  });
  window.classificadorV270={tipoRegime,classificar,analisar,render,linhasExcel};
  window.V270_CARREGADO=true;
})();
