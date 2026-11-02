/* V180 — Enquadramento recomendado por item, com referências documentais da LC 214/2025. */
(function(){
  const LC214='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numero=v=>{const n=Number(String(v??'').replace('%','').replace(',','.'));return Number.isFinite(n)?n:null};
  const pct=v=>v===null?'—':v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%';
  const codigo=(tipo,v)=>String(v||'').replace(/\D/g,'').padStart(tipo==='NCM'?8:9,'0');
  const vigente=o=>{const hoje='2026-11-02',ini=String(o?.DthIniVig||'').slice(0,10),fim=String(o?.DthFimVig||'').slice(0,10);return(!ini||ini<=hoje)&&(!fim||fim>=hoje)};
  const seguro=url=>/^https:\/\//i.test(String(url||''))?String(url):LC214;
  function identificar(r){
    const ncm=String(r.ncm||r.codigo_ncm||'').replace(/\D/g,'');
    const nbs=String(r.nbs||r.codigo_nbs||r.codigo_servico_nbs||'').replace(/\D/g,'');
    return ncm?{tipo:'NCM',codigo:codigo('NCM',ncm)}:nbs?{tipo:'NBS',codigo:codigo('NBS',nbs)}:null;
  }
  function referencia(item){
    const todos=typeof window.classificadorReferenciaPortal==='function'?window.classificadorReferenciaPortal(item.tipo,item.codigo):[];
    const ativos=todos.filter(x=>vigente(x.vinculo)&&vigente(x.classificacao)&&vigente(x.cst)&&x.vinculo?.TipoPermissao!=='VEDADO');
    return ativos.length===1?ativos[0]:null;
  }
  function dadosItem(r){
    const id=identificar(r),descricao=r.descricao_item||r.descricao_produto||r.descricao_servico||r.xProd||r.discriminacao||'Descrição não informada';
    if(!id)return {codigoProduto:r.codigo_produto||r.cProd||'—',descricao,tipo:'—',codigo:'—',status:'ANÁLISE NECESSÁRIA',mensagem:'O item não informa NCM ou NBS para consulta documental.'};
    const todos=typeof window.classificadorReferenciaPortal==='function'?window.classificadorReferenciaPortal(id.tipo,id.codigo):[];
    const ativos=todos.filter(x=>vigente(x.vinculo)&&vigente(x.classificacao)&&vigente(x.cst)&&x.vinculo?.TipoPermissao!=='VEDADO');
    if(ativos.length!==1)return {codigoProduto:r.codigo_produto||r.cProd||'—',descricao,tipo:id.tipo,codigo:id.codigo,status:ativos.length?'REVISÃO NECESSÁRIA':'ANÁLISE NECESSÁRIA',mensagem:ativos.length?'Há mais de uma hipótese aplicável; o enquadramento não foi selecionado automaticamente.':'Não foi localizado vínculo documental aplicável na base consultada.'};
    const x=referencia(id),v=x.vinculo||{},cl=x.classificacao||{},redI=numero(cl.PercRedIbs),redC=numero(cl.PercRedCbs),ibs=0.10,cbs=0.90;
    return {codigoProduto:r.codigo_produto||r.cProd||'—',descricao,tipo:id.tipo,codigo:id.codigo,status:'REFERÊNCIA DOCUMENTAL',cst:cl.Cst||v.cst||'—',classe:cl.CodClassTrib||v.cClassTrib||'—',anexo:v.NroAnexo||'—',item:v.NroItemAnexoLei||'—',ibs:pct(ibs),cbs:pct(cbs),redI:pct(redI),redC:pct(redC),finalI:pct(ibs*(1-(redI??0)/100)),finalC:pct(cbs*(1-(redC??0)/100)),url:seguro(cl.TexUrlLegislacao),mensagem:'Confirme condição, exceção, operação e vigência antes do enquadramento definitivo.'};
  }
  function cel(v){return '<td>'+esc(v||'—')+'</td>'}
  function linha(d){
    const anexo=d.url?'<a href="'+esc(d.url)+'" target="_blank" rel="noopener">Anexo '+esc(d.anexo)+' · item '+esc(d.item)+'</a>':'—';
    return '<tr><td>'+esc(d.codigoProduto)+'</td><td>'+esc(d.descricao)+'</td><td><b>'+esc(d.tipo)+'</b><br>'+esc(d.codigo)+'</td><td><span class="v180-status '+(d.status==='REFERÊNCIA DOCUMENTAL'?'ok':'review')+'">'+esc(d.status)+'</span><small>'+esc(d.mensagem)+'</small></td>'+cel(d.cst)+cel(d.classe)+'<td>'+anexo+'</td>'+cel(d.ibs)+cel(d.cbs)+'<td>'+esc(d.redI||'—')+' / '+esc(d.redC||'—')+'</td>'+cel(d.finalI)+cel(d.finalC)+'</tr>';
  }
  function render(){
    const sec=document.getElementById('observacoes');if(!sec)return;
    const lista=(state.items||[]).map(dadosItem);
    sec.innerHTML='<div class="card v180-enquadramento"><h2>Enquadramento recomendado</h2><p class="subtle">Análise por item a partir da NCM/NBS informada no documento e dos vínculos documentados na referência CST/cClassTrib. O sistema só apresenta CST e cClassTrib recomendados quando existe uma única hipótese vigente e não vedada. Nos demais casos, mantém a revisão necessária.</p>'+(lista.length?'<div class="v180-scroll"><table><thead><tr><th>Código do produto</th><th>Descrição</th><th>NCM ou NBS</th><th>Validação</th><th>CST recomendada</th><th>cClassTrib recomendada</th><th>Anexo / artigo</th><th>IBS cheio</th><th>CBS cheia</th><th>Redução IBS / CBS</th><th>Alíquota final IBS</th><th>Alíquota final CBS</th></tr></thead><tbody>'+lista.map(linha).join('')+'</tbody></table></div><p class="v180-legal">Os links de Anexo / artigo abrem a referência legislativa indicada no Portal CST/cClassTrib; quando não houver link específico, a consulta oficial segue para a <a href="'+LC214+'" target="_blank" rel="noopener">LC 214/2025</a>. Atualizações legislativas somente serão exibidas quando estiverem registradas na fonte documental anexada.</p>':'<p class="hint">Carregue e processe documentos para visualizar o enquadramento recomendado por produto ou serviço.</p>')+'</div>';
  }
  const css=document.createElement('style');css.textContent='.v180-enquadramento h2{color:#123d60;margin:0 0 8px}.v180-scroll{overflow:auto;border:1px solid #c5d3df;border-radius:8px}.v180-scroll table{border-collapse:collapse;min-width:1600px;width:100%;font-size:12px}.v180-scroll th,.v180-scroll td{padding:9px 10px;border:1px solid #d7e1e8;text-align:left;vertical-align:top;color:#172a39}.v180-scroll th{background:#123d60;color:#fff;white-space:nowrap}.v180-scroll td:nth-child(1),.v180-scroll td:nth-child(3),.v180-scroll td:nth-child(n+5){white-space:nowrap}.v180-scroll td small{display:block;margin-top:5px;min-width:210px;white-space:normal;color:#536879;line-height:1.35}.v180-status{display:inline-block;padding:3px 6px;border-radius:4px;font-weight:800;font-size:10px}.v180-status.ok{background:#e5f5eb;color:#17683a}.v180-status.review{background:#fff2d9;color:#805100}.v180-scroll a,.v180-legal a{color:#0d5b92!important;font-weight:800}.v180-legal{margin:12px 0 0;font-size:12px;line-height:1.5;color:#405563}';document.head.appendChild(css);
  const tab=document.querySelector('.tab[data-tab="observacoes"]');tab?.addEventListener('click',()=>setTimeout(render,0));
  window.classificadorRenderEnquadramentoRecomendado=render;
})();
