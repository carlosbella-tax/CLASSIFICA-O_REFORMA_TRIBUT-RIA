/* V251 — NFS-e usa código de serviço da nota ou hipóteses da consulta NBS, nunca CFOP.
   A correlação é documental: não altera impostos da nota nem escolhe uma hipótese ambígua. */
(function(){
  const LC214='https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm';
  const dig=v=>String(v||'').replace(/\D/g,'');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const base=()=>Array.isArray(window.ANEXO_VIII_CORRELACAO)?window.ANEXO_VIII_CORRELACAO:[];
  const nfse=r=>!!r&&(!!r.dados_nfse||/NFS/i.test(String(r.tipo_documento||r.tipo_de_documento||'')));
  const serv=r=>String(r.dados_nfse?.codigo_servico||r.codigo_servico||r.item_lista_servico||r.codigo_servico_nbs||'').trim();
  const nbs=r=>String(r.dados_nfse?.nbs||r.nbs||r.codigo_nbs||'').trim();
  function chaveServico(v){let k=dig(String(v||'').split('/')[0]);if(k.length===6)k=k.slice(0,4);return k.length===3?k.padStart(4,'0'):k;}
  const vigente=x=>{const hoje=new Date().toISOString().slice(0,10),ini=String(x?.DthIniVig||x?.inicio||'').slice(0,10),fim=String(x?.DthFimVig||x?.fim||'').slice(0,10);return(!ini||ini<=hoje)&&(!fim||fim>=hoje)};
  const numero=v=>v===null||v===undefined||v===''?null:Number(String(v).replace('%','').replace(',','.'));
  const pct=v=>Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})+'%':'A confirmar';
  window.classificadorV251EhNfse=nfse;
  window.classificadorV248BuscarCorrelacao=function(bruto){
    const k=dig(String(bruto||'').split('/')[0]);if(!k)return [];
    const lista=k.length>=7?base().filter(x=>dig(x.nbs)===k||(k.length<9&&dig(x.nbs).startsWith(k))):base().filter(x=>chaveServico(x.codigo)===chaveServico(bruto));
    const vistos=new Set;return lista.filter(x=>{const id=[x.codigo,x.nbs,x.cClassTrib,x.indop,x.onerosa,x.exterior,x.local].join('|');if(vistos.has(id))return false;vistos.add(id);return true});
  };
  function correlacoes(r){
    const s=serv(r),n=dig(nbs(r)),porServico=s?window.classificadorV248BuscarCorrelacao(s):[];
    if(porServico.length)return n?porServico.filter(x=>dig(x.nbs)===n):porServico;
    return n?base().filter(x=>dig(x.nbs)===n):[];
  }
  function regras(r){
    return correlacoes(r).map(x=>{
      const ref=window.classificadorReferenciaClasse?.(x.cClassTrib),cl=ref?.classificacao||{},cst=cl.Cst||'A confirmar';
      const vinculos=(window.classificadorReferenciaPortal?.('NBS',dig(x.nbs))||[]).filter(v=>v.vinculo?.cClassTrib===x.cClassTrib);
      const permitido=!!ref&&(!vinculos.length||vinculos.some(v=>v.vinculo?.TipoPermissao!=='VEDADO'&&vigente(v.vinculo)))&&vigente(cl)&&vigente(ref?.cst)&&cl.IndNfse!==false;
      const redI=numero(cl.PercRedIbs),redC=numero(cl.PercRedCbs),calculavel=!!ref&&permitido&&['000','200'].includes(cst)&&Number.isFinite(redI)&&Number.isFinite(redC);
      return {correlacao:x,cst,classe:x.cClassTrib,nome:cl.NomeClassTrib||x.cClassTribNome||'Regra a confirmar',redI:pct(redI),redC:pct(redC),finalI:calculavel?pct(0.10*(1-redI/100)):'A confirmar',finalC:calculavel?pct(0.90*(1-redC/100)):'A confirmar',url:/^https:\/\//i.test(cl.TexUrlLegislacao||'')?cl.TexUrlLegislacao:LC214,permitido};
    });
  }
  window.classificadorV251RegrasServico=regras;
  window.classificadorV251DadosServico=function(r){
    const lista=regras(r),s=serv(r),n=nbs(r),classes=[...new Set(lista.map(x=>x.classe))],codigos=[...new Set(lista.map(x=>x.correlacao.codigo))],ns=[...new Set(lista.map(x=>x.correlacao.nbs))];
    const unico=campo=>{const vals=[...new Set(lista.map(x=>x[campo]))];return vals.length===1?vals[0]:'Conforme hipótese'};
    const revisao=lista.length!==1||lista.some(x=>!x.permitido);
    return {codigoProduto:s||codigos.join(' / ')||'—',descricao:r.descricao_item||r.descricao_servico||r.dados_nfse?.descricao_servico||'Serviço',tipo:'SERVIÇO',codigo:n||ns.join(' / ')||'—',status:!lista.length?'ANÁLISE NECESSÁRIA':revisao?'REVISÃO NECESSÁRIA':'REFERÊNCIA DOCUMENTAL',cst:lista.length?unico('cst'):'—',classe:classes.join(', ')||'—',anexo:'VIII — correlação NBS/serviço',item:'—',ibs:lista.length?'0,10%':'—',cbs:lista.length?'0,90%':'—',redI:lista.length?unico('redI'):'—',redC:lista.length?unico('redC'):'—',finalI:lista.length&&!revisao?unico('finalI'):'A confirmar',finalC:lista.length&&!revisao?unico('finalC'):'A confirmar',url:lista.length?lista[0].url:LC214,mensagem:!lista.length?'Sem correlação compatível entre o código de serviço e a NBS; confirme a nota e a tabela.':(s?'Código de serviço da nota preservado. ':'Código(s) de serviço da correlação NBS. ')+(revisao?'Há hipóteses distintas; nenhuma foi escolhida automaticamente. ':'Hipótese documental; confirme as condições. ')+lista.map(x=>'cClassTrib '+x.classe+': '+x.nome+' · onerosa '+(x.correlacao.onerosa||'a confirmar')+' · exterior '+(x.correlacao.exterior||'a confirmar')+' · INDOP '+(x.correlacao.indop||'a confirmar')+' · incidência '+(x.correlacao.local||'a confirmar')).join(' | ')+' Parâmetros de 2026: IBS 0,10% e CBS 0,90%; não equivalem aos impostos da nota.'};
  };
  window.classificadorV251AplicarConsulta=function(bruto,correlacoesConsulta){
    if(typeof state==='undefined'||!correlacoesConsulta?.length)return 0;
    const ns=[...new Set(correlacoesConsulta.map(x=>dig(x.nbs)))];
    if(ns.length!==1||dig(bruto).length!==9)return 0;
    let total=0;
    (state.items||[]).forEach(r=>{
      if(!nfse(r)||nbs(r))return;
      const s=serv(r),existentes=s?window.classificadorV248BuscarCorrelacao(s):[];
      const compativeis=s&&existentes.length?correlacoesConsulta.filter(x=>chaveServico(x.codigo)===chaveServico(s)):correlacoesConsulta;
      if(!compativeis.length)return;
      const codigos=[...new Set(compativeis.map(x=>x.codigo))],formatado=compativeis[0].nbs;
      r.nbs=formatado;r.nbs_digital=ns[0];r.nbs_origem='consulta Anexo VIII';
      if(!s&&codigos.length===1){r.codigo_servico=codigos[0];r.codigo_servico_origem='correlação NBS';}
      if(r.dados_nfse){r.dados_nfse.nbs=formatado;if(!s&&codigos.length===1)r.dados_nfse.codigo_servico=codigos[0];}
      total++;
    });
    return total;
  };
  window.classificadorV251QuadroServicos=function(itens){
    const sec=document.createElement('section');sec.className='v181-cfop v251-servicos';
    sec.innerHTML='<h3>Códigos de serviço da operação — regras de IBS/CBS</h3><p class="subtle">NFS-e usa código de serviço, não CFOP. Prioridade: código da nota; na ausência, correlação da NBS. Hipóteses distintas permanecem em revisão. As alíquotas abaixo são parâmetros de 2026.</p><div class="v181-scroll"><table><thead><tr><th>Código de serviço (LC 116/2003)</th><th>Descrição do serviço</th><th>NBS</th><th>Origem</th><th>CST recomendada</th><th>cClassTrib recomendada</th><th>Tratamento IBS/CBS</th><th>Redução IBS / CBS</th><th>Alíquota final IBS / CBS</th><th>Base legal</th></tr></thead><tbody>'+itens.map(r=>{
      const d=window.classificadorV251DadosServico(r),rs=regras(r);
      return '<tr><td>'+esc(d.codigoProduto)+'</td><td>'+esc(d.descricao)+'</td><td>'+esc(d.codigo)+'</td><td>'+esc(serv(r)?(r.codigo_servico_origem==='correlação NBS'?'Correlação NBS':'Nota fiscal'):'Correlação NBS / confirmar')+'</td><td>'+esc(d.cst)+'</td><td>'+esc(d.classe)+'</td><td><b>'+esc(d.status)+'</b><small>'+esc(d.mensagem)+'</small></td><td>'+esc(d.redI+' / '+d.redC)+'</td><td>'+esc(d.finalI+' / '+d.finalC)+'</td><td>'+rs.map(x=>'<a href="'+esc(x.url)+'" target="_blank" rel="noopener">cClassTrib '+esc(x.classe)+' — legislação</a>').join('<br>')+'</td></tr>';
    }).join('')+'</tbody></table></div>';
    return sec;
  };
})();
