/* V161 — Dashboard consolidado da validação IBS/CBS e análise tributária por CNAE. */
(function(){
  const LC214='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';
  const LC227='https://www2.camara.leg.br/legin/fed/leicom/2026/leicomplementar-227-13-janeiro-2026-798657-normaatualizada-pl.html';
  const h=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const texto=v=>String(v??'').trim()||'Não informado';
  const cnaeFormatado=c=>c.length===7?c.slice(0,4)+'-'+c.slice(4,5)+'/'+c.slice(5):c;
  function referencia(item){
    const nbs=String(item.nbs||item.codigo_nbs||'').trim();
    if(nbs||item.codigo_servico){
      const lote=(window.classificadorLoteNcmNbs||[]).find(x=>x.tipo==='NBS'&&String(x.codigo||'').replace(/\D/g,'')===nbs.replace(/\D/g,''));
      return {codigo:nbs||String(item.codigo_servico||''),tipo:'NBS',situacao:lote?'REFERÊNCIA EM PLANILHA — confirmar enquadramento legal':'ANALISAR — base oficial NBS não disponível',cst:lote?.cst_sugerido||'A confirmar',cclasstrib:lote?.cclasstrib_sugerida||'A confirmar',anexo:lote?.anexo||'A confirmar — base oficial NBS não embarcada'};
    }
    const ncm=String(item.ncm||'').replace(/\D/g,'').padStart(8,'0');
    const r=typeof window.classificadorReferenciaNcm==='function'?window.classificadorReferenciaNcm(ncm):null;
    const localizada=r&&r.descricao&&!/^NCM não/i.test(r.descricao||'');
    return {codigo:ncm,tipo:'NCM',situacao:localizada?'VALIDADO — NCM localizada na TIPI embarcada':'ANALISAR — NCM não localizada na TIPI embarcada',cst:r?.cst||'A confirmar',cclasstrib:r?.cclasstrib||'A confirmar',anexo:r?.anexo||'Sem anexo candidato identificado'};
  }
  function cnaes(){return [...new Set((document.getElementById('cnaesEmpresa')?.value||'').split(/[;,\n]+/).map(v=>v.replace(/\D/g,'')).filter(Boolean))];}
  function painelIbs(){
    const itens=(typeof state==='undefined'?[]:state.items||[]).filter(r=>r&&(r.ncm||r.nbs||r.codigo_nbs||r.codigo_servico));
    const rows=itens.map(item=>{const r=referencia(item);return {documento:item.numero_nota||item.numero_documento||item.tipo_de_documento||'Documento processado',codigo_item:item.codigo_item||item.cProd||item.codigo_servico||'—',descricao:item.descricao_item||item.xProd||item.descricao_servico||'—',ref:r,cstXml:texto(item.cst_ibs_cbs),ccXml:texto(item.cclasstrib)};});
    let card=document.getElementById('v161-ibs-dashboard');if(!card){card=document.createElement('section');card.id='v161-ibs-dashboard';card.className='dashboard-card v161-card';document.querySelector('#dashboard .dashboard-v6')?.appendChild(card);}
    const corpo=rows.map(x=>'<tr><td>'+h(x.documento)+'</td><td>'+h(x.codigo_item)+'</td><td>'+h(x.descricao)+'</td><td><b>'+h(x.ref.tipo)+'</b><br>'+h(x.ref.codigo)+'</td><td>'+h(x.cstXml)+'</td><td>'+h(x.ref.cst)+'</td><td>'+h(x.ccXml)+'</td><td>'+h(x.ref.cclasstrib)+'</td><td>'+h(x.ref.anexo)+'</td><td class="v161-status '+(x.ref.situacao.startsWith('VALIDADO')?'ok':'review')+'">'+h(x.ref.situacao)+'</td></tr>').join('');
    card.innerHTML='<h3>Análise de IBS/CBS — NCM e NBS</h3><p class="subtle">Comparação por item entre os dados informados no documento e a referência de classificação disponível. A análise final depende da operação e da hipótese legal.</p><div class="v161-scroll"><table class="dash-detail-table"><thead><tr><th>Documento</th><th>Código do item/serviço</th><th>Descrição</th><th>NCM / NBS</th><th>CST informado</th><th>CST sugerido</th><th>cClassTrib informado</th><th>cClassTrib sugerido</th><th>Anexo / enquadramento</th><th>Resultado</th></tr></thead><tbody>'+(corpo||'<tr><td colspan="10" class="dash-empty">Processe XML ou PDF com NCM/NBS para visualizar a análise IBS/CBS.</td></tr>')+'</tbody></table></div><p class="v161-source">Fonte de referência: <a href="'+LC214+'" target="_blank" rel="noopener">LC 214/2025</a> e TIPI para NCM. A NBS requer fonte oficial ou planilha de referência carregada.</p>';
  }
  function painelCnae(){
    const lista=cnaes();let card=document.getElementById('v161-cnae-dashboard');if(!card){card=document.createElement('section');card.id='v161-cnae-dashboard';card.className='dashboard-card v161-card';document.querySelector('#dashboard .dashboard-v6')?.appendChild(card);}
    const blocos=lista.filter(c=>c.length===7).map((c,i)=>'<article class="v161-cnae"><h4>'+h(cnaeFormatado(c))+(i===0?' — CNAE principal':' — CNAE secundário')+'</h4><ul><li><b>Incidência IBS/CBS:</b> conferir o bem ou serviço, a operação, o destinatário e o local da operação.</li><li><b>Classificação:</b> validar NCM ou NBS, CST, cClassTrib e o anexo/enquadramento de cada item documental.</li><li><b>Tratamentos específicos:</b> verificar redução de alíquota, alíquota zero, isenção, regimes específicos ou diferenciados previstos na LC 214/2025.</li><li><b>Créditos e obrigações:</b> avaliar a apropriação de créditos, escrituração e documentação conforme as regras aplicáveis.</li><li><b>Administração do IBS:</b> acompanhar regras operacionais, de arrecadação e processo sob a LC 227/2026 e o CGIBS.</li></ul></article>').join('');
    card.innerHTML='<h3>Análise da Reforma Tributária por atividade — CNAE</h3><p class="subtle">Pontos de análise para cada atividade declarada. O CNAE organiza a revisão, mas não substitui a classificação técnica NCM/NBS nem define, isoladamente, CST, cClassTrib, alíquota ou benefício.</p><div class="v161-cnae-grid">'+(blocos||'<p class="dash-empty">Informe os CNAEs da empresa no cabeçalho para gerar a análise por atividade.</p>')+'</div><p class="v161-source">Referências: <a href="'+LC214+'" target="_blank" rel="noopener">LC 214/2025</a> e <a href="'+LC227+'" target="_blank" rel="noopener">LC 227/2026</a>. Conteúdo informativo sujeito à confirmação na legislação aplicável.</p>';
  }
  const css=document.createElement('style');css.textContent=`.v161-card{margin-top:18px}.v161-scroll{overflow:auto;border:1px solid #c5d3df;border-radius:8px}.v161-scroll table{min-width:1350px}.v161-status{font-weight:800}.v161-status.ok{color:#08753e!important}.v161-status.review{color:#9a4d10!important}.v161-source{margin:12px 0 0;font-size:12px}.v161-source a{color:#0e5b91!important;font-weight:700}.v161-cnae-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:12px}.v161-cnae{border:1px solid #c5d3df;border-left:4px solid #f26a21;border-radius:8px;padding:14px;background:#f8fbfd}.v161-cnae h4{margin:0 0 8px;color:#123d60!important}.v161-cnae ul{margin:0;padding-left:19px;color:#263d50;line-height:1.55;font-size:13px}`;document.head.appendChild(css);
  const anterior=window.renderDashboard;
  if(typeof anterior==='function')window.renderDashboard=function(){const resultado=anterior.apply(this,arguments);painelIbs();painelCnae();return resultado;};
})();
