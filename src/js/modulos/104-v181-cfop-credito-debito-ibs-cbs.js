/* V181 — Quadro de CFOPs carregados: natureza da operação e referência de crédito/débito IBS/CBS. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const codigo=(tipo,v)=>String(v||'').replace(/\D/g,'').padStart(tipo==='NCM'?8:9,'0');
  const vigente=o=>{const hoje='2026-11-02',ini=String(o?.DthIniVig||'').slice(0,10),fim=String(o?.DthFimVig||'').slice(0,10);return(!ini||ini<=hoje)&&(!fim||fim>=hoje)};
  function itemRef(r){
    const ncm=String(r.ncm||'').replace(/\D/g,''),nbs=String(r.nbs||r.codigo_nbs||'').replace(/\D/g,''),tipo=ncm?'NCM':nbs?'NBS':'';
    if(!tipo||typeof window.classificadorReferenciaPortal!=='function')return null;
    const ativos=window.classificadorReferenciaPortal(tipo,codigo(tipo,tipo==='NCM'?ncm:nbs)).filter(x=>vigente(x.vinculo)&&vigente(x.classificacao)&&vigente(x.cst)&&x.vinculo?.TipoPermissao!=='VEDADO');
    return ativos.length===1?ativos[0]:null;
  }
  function resumir(){
    const mapa=new Map;
    (state.items||[]).forEach(r=>{
      const cfop=String(r.cfop||r.cfop_xml||'Sem CFOP'),operacao=typeof tipoOperacao==='function'?tipoOperacao(r):'';
      const chave=cfop+'|'+operacao,atual=mapa.get(chave)||{cfop,operacao,descricao:r.descricao_cfop||window.cfopDesc?.(cfop)||'Descrição do CFOP não localizada',itens:0,csts:new Set,classes:new Set};
      atual.itens++;const ref=itemRef(r),v=ref?.vinculo||{},cl=ref?.classificacao||{};
      if(ref){atual.csts.add(cl.Cst||v.cst);atual.classes.add(cl.CodClassTrib||v.cClassTrib)};
      mapa.set(chave,atual);
    });
    return [...mapa.values()].sort((a,b)=>String(a.cfop).localeCompare(String(b.cfop),'pt-BR',{numeric:true}));
  }
  function natureza(x){
    if(x.operacao==='ENTRADAS')return {mov:'Entrada',efeito:'Possibilidade de crédito de IBS/CBS',nota:'A apropriação depende do vínculo com atividade tributada, do documento idôneo e das demais condições legais.'};
    if(x.operacao==='SAÍDAS')return {mov:'Saída',efeito:'Possibilidade de débito de IBS/CBS',nota:'O débito depende do fato gerador e do tratamento aplicável ao bem ou serviço; confirme anexo, condições e exceções.'};
    return {mov:'Operação a classificar',efeito:'Análise necessária',nota:'Não foi possível caracterizar entrada ou saída exclusivamente pelos dados carregados.'};
  }
  function valores(set){return set.size===1?[...set][0]:set.size?'Conforme item / revisão necessária':'Sem referência única';}
  function quadro(){
    const destino=document.querySelector('#observacoes .v180-enquadramento');if(!destino)return;
    destino.querySelector('.v181-cfop')?.remove();const lista=resumir();
    const linhas=lista.map(x=>{const n=natureza(x);return '<tr><td><b>'+esc(x.cfop)+'</b></td><td>'+esc(x.descricao)+'</td><td>'+esc(n.mov)+'</td><td><b>'+esc(n.efeito)+'</b><small>'+esc(n.nota)+'</small></td><td>'+esc(valores(x.csts))+'</td><td>'+esc(valores(x.classes))+'</td><td>'+x.itens+'</td></tr>';}).join('');
    const sec=document.createElement('section');sec.className='v181-cfop';sec.innerHTML='<h3>CFOPs da operação — referência de crédito e débito de IBS/CBS</h3><p class="subtle">CFOPs identificados nos documentos carregados, descritos segundo a operação. A indicação abaixo é uma referência analítica: o CFOP não define isoladamente crédito, débito, CST ou cClassTrib.</p>'+(lista.length?'<div class="v181-scroll"><table><thead><tr><th>CFOP</th><th>Descrição da operação</th><th>Movimentação</th><th>Tratamento IBS/CBS</th><th>CST recomendada</th><th>cClassTrib recomendada</th><th>Itens</th></tr></thead><tbody>'+linhas+'</tbody></table></div>':'<p class="hint">Carregue e processe XMLs para relacionar os CFOPs da operação.</p>');destino.appendChild(sec);
  }
  const css=document.createElement('style');css.textContent='.v181-cfop{margin-top:20px;padding-top:17px;border-top:2px solid #d6e1e9}.v181-cfop h3{margin:0 0 6px;color:#123d60}.v181-scroll{overflow:auto;border:1px solid #c5d3df;border-radius:8px}.v181-scroll table{width:100%;min-width:1100px;border-collapse:collapse;font-size:12px}.v181-scroll th,.v181-scroll td{padding:9px 10px;border:1px solid #d7e1e8;text-align:left;vertical-align:top;color:#172a39}.v181-scroll th{background:#315f82;color:#fff;white-space:nowrap}.v181-scroll td small{display:block;margin-top:5px;min-width:290px;color:#536879;line-height:1.35}.v181-scroll td:nth-child(1),.v181-scroll td:nth-child(3),.v181-scroll td:nth-child(n+5){white-space:nowrap}';document.head.appendChild(css);
  document.querySelector('.tab[data-tab="observacoes"]')?.addEventListener('click',()=>setTimeout(quadro,20));
  window.classificadorRenderCfopIbsCbs=quadro;
})();
