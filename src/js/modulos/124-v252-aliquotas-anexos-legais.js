/* V252 — Enquadramento: alíquotas separadas, redução única e cálculo efetivo.
   Anexo legal vem do vínculo/NomeClassTrib, nunca do título da planilha de correlação.
   Hipóteses e condições permanecem explícitas; valores fiscais originais não são alterados. */
(function(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const numero=v=>v===null||v===undefined||v===''?null:Number(String(v).replace('%','').replace(',','.'));
  const fmt=v=>Number.isFinite(v)?v.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}):'A confirmar';
  const pct=v=>Number.isFinite(v)?fmt(v)+'%':'A confirmar';
  const vigente=x=>{const hoje=new Date().toISOString().slice(0,10),ini=String(x?.DthIniVig||x?.inicio||'').slice(0,10),fim=String(x?.DthFimVig||x?.fim||'').slice(0,10);return(!ini||ini<=hoje)&&(!fim||fim>=hoje)};
  const ativo=x=>x.vinculo?.TipoPermissao!=='VEDADO'&&vigente(x.vinculo)&&vigente(x.classificacao)&&vigente(x.cst);
  const parametros=()=>window.classificadorAliquotasCronograma?.()||{ano:Number(document.getElementById('anoPeriodo')?.value)||'não definido',ibsMunicipal:null,ibsEstadual:null,cbs:null};
  const romano=n=>{const mapa=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let s='';for(const [v,k]of mapa)while(n>=v){s+=k;n-=v}return s};
  function referencias(r,d){
    if(window.classificadorV251EhNfse?.(r))return (window.classificadorV251RegrasServico(r)||[]).flatMap(x=>{
      const ref=window.classificadorReferenciaClasse?.(x.classe);if(!ref)return [];
      const vs=(window.classificadorReferenciaPortal?.('NBS',x.correlacao.nbs)||[]).filter(v=>v.vinculo?.cClassTrib===x.classe&&ativo(v));
      return (vs.length?vs:[ref]).map(v=>({...v,permitido:x.permitido}));
    });
    return (window.classificadorReferenciaPortal?.(d.tipo,d.codigo)||[]).filter(ativo);
  }
  function legal(ref){
    const cl=ref.classificacao||{},v=ref.vinculo||{},bruto=String(cl.TexUrlLegislacao||'').trim();
    let url='',artigo='';try{const u=new URL(bruto);if(u.protocol==='https:'&&u.hostname==='www.planalto.gov.br'&&/\/lcp214\.htm$/i.test(u.pathname)&&/^#art\d+[a-z]?$/i.test(u.hash)){url=u.href;artigo=u.hash.slice(4)}}catch{}
    const nomes=String(cl.NomeClassTrib||'')+' '+String(cl.NomeReduzido||'');
    const anexos=Number(v.NroAnexo)>0?[romano(Number(v.NroAnexo))]:[...new Set([...nomes.matchAll(/\bAnexo\s+([IVXLCDM]+)\b/gi)].map(x=>x[1].toUpperCase()))];
    const anexo=anexos.length?'Anexo '+anexos.join(' / '):artigo==='4'?'Não aplicável à referência legal indicada':'Anexo não identificado na referência';
    return {url,artigo,anexo,classe:cl.CodClassTrib||v.cClassTrib||'—',descricao:cl.NomeReduzido||cl.NomeClassTrib||v.DescAnexo||'Base legal não documentada',condicao:[v.DescCondicao,v.DescExcecao&&'Exceção: '+v.DescExcecao].filter(Boolean).join(' · ')};
  }
  function efetiva(aliquota,reducao,permitido){
    if(!permitido||!Number.isFinite(aliquota)||!Number.isFinite(reducao)||reducao<0||reducao>100)return {valor:null,texto:'A confirmar — hipótese/condição em revisão'};
    const desconto=aliquota*reducao/100,valor=aliquota-desconto;
    return {valor,texto:reducao>0?pct(aliquota)+' − '+fmt(desconto)+' p.p. (redução '+pct(reducao)+') = '+pct(valor):pct(valor)+' (sem redução)'};
  }
  /* V254 — NCM com anexos diferentes no Motor e no Classificador: exibe os dois e exige revisão, sem redução. */
  function dados(r){const d=dadosBase(r);return typeof window.classificadorV254Divergencia==='function'?window.classificadorV254Divergencia(r,d):d}
  function dadosBase(r){
    r=r||{};const d=window.classificadorDadosEnquadramento(r),refs=referencias(r,d),aliquotas=parametros();
    /* A apresentação não conserva a mensagem fixa de 2026 quando o ano é alterado. */
    d.mensagem=String(d.mensagem||'').replace(/ Parâmetros de 2026:.*$/,'')+' Alíquotas-base do cronograma de '+aliquotas.ano+'; não equivalem aos impostos da nota.';
    if(!window.classificadorV251EhNfse?.(r)&&d.tipo!=='—'){
      const unica=refs.length===1&&!!refs[0].classificacao;
      d.status=unica?'REFERÊNCIA DOCUMENTAL':refs.length?'REVISÃO NECESSÁRIA':'ANÁLISE NECESSÁRIA';
      d.cst=unica?refs[0].classificacao.Cst:'—';d.classe=unica?refs[0].classificacao.CodClassTrib:'—';
    }
    const classes=[...new Set(refs.map(x=>x.classificacao?.CodClassTrib))],ref=refs[0],cl=ref?.classificacao||{};
    const redI=numero(cl.PercRedIbs),redC=numero(cl.PercRedCbs),iguais=Number.isFinite(redI)&&Number.isFinite(redC)&&redI===redC;
    const permitido=d.status==='REFERÊNCIA DOCUMENTAL'&&classes.length===1&&refs.every(x=>x.permitido!==false)&&['000','200'].includes(cl.Cst)&&iguais;
    const vistos=new Set,legais=refs.map(legal).filter(x=>{const k=[x.url,x.anexo,x.classe,x.condicao].join('|');if(vistos.has(k))return false;vistos.add(k);return true});
    return {...d,aliquotas,legais,reducao:refs.length&&classes.length===1?(iguais?pct(redI):'Revisão necessária — reduções distintas ou não documentadas'):'A confirmar — conforme hipótese',efetivas:{ibsMunicipal:efetiva(numero(aliquotas.ibsMunicipal),redI,permitido),ibsEstadual:efetiva(numero(aliquotas.ibsEstadual),redI,permitido),cbs:efetiva(numero(aliquotas.cbs),redC,permitido)}};
  }
  window.classificadorV252DadosEnquadramento=dados;
  window.classificadorV252Aliquotas=parametros;
  const taxasCab='<th>Alíquota de IBS Municipal</th><th>Alíquota de IBS Estadual</th><th>Alíquota de CBS</th>';
  window.classificadorV252CabecalhoAliquotas=taxasCab;
  const taxas=a=>'<td>'+esc(pct(numero(a.ibsMunicipal)))+'</td><td>'+esc(pct(numero(a.ibsEstadual)))+'</td><td>'+esc(pct(numero(a.cbs)))+'</td>';
  window.classificadorV252CelulasAliquotas=()=>taxas(parametros());
  const tratamento=d=>'<td><b>'+esc(d.status)+'</b><small>'+esc(d.mensagem)+'</small></td>';
  const calculos=d=>'<td class="v252-efetivas">'+[['IBS Municipal','ibsMunicipal'],['IBS Estadual','ibsEstadual'],['CBS','cbs']].map(([nome,k])=>'<div><b>'+nome+':</b> '+esc(d.efetivas[k].texto)+'</div>').join('')+'</td>';
  const anexos=d=>'<td class="v252-anexos">'+(d.legais.length?[...new Set(d.legais.map(x=>x.anexo+' · cClassTrib '+x.classe))].map(esc).join('<br>'):'Anexo não identificado — confirmar NCM/NBS')+(d.divergenciaMotor?'<br><b>Motor:</b> '+esc(d.divergenciaMotor.motorTexto)+'<br><b>Revisão obrigatória</b>':'')+'</td>';
  const leis=d=>'<td class="v252-base-legal">'+(d.legais.length?d.legais.map(x=>(x.url?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener">LC 214/2025 — art. '+esc(x.artigo)+' · cClassTrib '+esc(x.classe)+'</a>':'Artigo não identificado na referência')+'<small>'+esc(x.descricao)+(x.condicao?' · '+esc(x.condicao):'')+'</small>').join('<br>'):'Base legal não documentada — confirmar o enquadramento')+'</td>';
  const finaisCab=taxasCab+'<th>Redução IBS / CBS</th><th>Alíquota final IBS / CBS</th><th>Anexo da LC 214/2025</th><th>Base legal</th>';
  const finais=d=>taxas(d.aliquotas)+'<td>'+esc(d.reducao)+'</td>'+calculos(d)+anexos(d)+leis(d);
  function render(){
    const sec=document.getElementById('observacoes');if(!sec)return;const lista=(state.items||[]).map(dados),ano=parametros().ano;
    sec.innerHTML='<div class="card v180-enquadramento"><h2>Enquadramento recomendado — '+lista.length+' item(ns) analisado(s)</h2><p class="subtle">Referências documentais por NCM/NBS e código de serviço. Alíquotas-base do cronograma editável de '+esc(ano)+'. Redução comum exibida uma única vez; o cálculo desconta a redução proporcional da alíquota, em pontos percentuais. Hipóteses distintas permanecem em revisão e os impostos originais da nota são preservados.</p>'+(lista.length?'<div class="v180-scroll"><table><thead><tr><th>Código do item</th><th>Descrição do item</th><th>NCM ou NBS</th><th>CST recomendada</th><th>cClassTrib recomendada</th><th>Tratamento IBS/CBS</th>'+finaisCab+'</tr></thead><tbody>'+lista.map(d=>'<tr><td>'+esc(d.codigoProduto)+'</td><td>'+esc(d.descricao)+'</td><td><b>'+esc(d.tipo)+'</b><br>'+esc(d.codigo)+'</td><td>'+esc(d.cst||'—')+'</td><td>'+esc(d.classe||'—')+'</td>'+tratamento(d)+finais(d)+'</tr>').join('')+'</tbody></table></div><p class="v180-legal">Anexos e artigos são os documentados na referência de cada hipótese, não o anexo da planilha de correlação. A Base legal abre diretamente no artigo oficial. Confirme condições, exceções e vigência antes da aplicação definitiva.</p>':'<p class="hint">Carregue e processe documentos para visualizar o enquadramento recomendado por produto ou serviço.</p>')+'</div>';
  }
  window.classificadorV252RenderEnquadramento=render;
  /* A segregação por tipo da V251 permanece; somente a apresentação do quadro muda. */
  window.classificadorV251QuadroServicos=function(itens){
    const sec=document.createElement('section');sec.className='v181-cfop v251-servicos';
    sec.innerHTML='<h3>Códigos de serviço da operação — regras de IBS/CBS</h3><p class="subtle">Código da nota tem prioridade; a correlação NBS não determina automaticamente uma hipótese ambígua. Alíquotas-base do cronograma de '+esc(parametros().ano)+'.</p><div class="v181-scroll"><table><thead><tr><th>Código de serviço (LC 116/2003)</th><th>Descrição do serviço</th><th>NBS</th><th>Origem</th><th>CST recomendada</th><th>cClassTrib recomendada</th><th>Tratamento IBS/CBS</th>'+finaisCab+'</tr></thead><tbody>'+itens.map(r=>{const d=dados(r),codigoNota=r.dados_nfse?.codigo_servico||r.codigo_servico;return '<tr><td>'+esc(d.codigoProduto)+'</td><td>'+esc(d.descricao)+'</td><td>'+esc(d.codigo)+'</td><td>'+esc(codigoNota?(r.codigo_servico_origem==='correlação NBS'?'Correlação NBS':'Nota fiscal'):'Correlação NBS / confirmar')+'</td><td>'+esc(d.cst)+'</td><td>'+esc(d.classe)+'</td>'+tratamento(d)+finais(d)+'</tr>'}).join('')+'</tbody></table></div>';return sec;
  };
  /* V252 — Troca de ano e edição local refletem imediatamente nos quadros visíveis. */
  const atualizar=()=>{if(document.querySelector('#observacoes .v180-enquadramento')||document.getElementById('observacoes')?.classList.contains('active')){render();window.classificadorRenderCfopIbsCbs?.()}};
  /* O cabeçalho legado intercepta change na captura e renderiza após 450 ms. */
  window.classificadorV252AtualizarCronograma=()=>setTimeout(atualizar,550);
  document.addEventListener('change',e=>{if(e.target?.id==='anoPeriodo'||e.target?.dataset?.v168Tributo)atualizar()});
  document.addEventListener('click',e=>{if(['v168-restaurar','v168-salvar'].includes(e.target?.id))setTimeout(atualizar,0)});
  const css=document.createElement('style');css.textContent='.v252-efetivas,.v252-anexos,.v252-base-legal{white-space:normal!important;min-width:245px}.v252-efetivas div{margin-bottom:7px;line-height:1.5}.v252-base-legal small{white-space:normal;max-width:480px}.v180-scroll table,.v251-servicos table{min-width:2100px}';document.head.appendChild(css);
})();
