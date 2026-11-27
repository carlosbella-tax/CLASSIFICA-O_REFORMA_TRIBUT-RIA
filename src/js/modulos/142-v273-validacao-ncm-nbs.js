/* V273 — Enquadramento recomendado: validação do CST e do cClassTrib de IBS/CBS informados em cada item
   contra a relação de NCM (aba "TIPI - Base Completa" da planilha da Reforma Tributária) e a relação de
   NBS × código de serviço (planilha "NBS Anexo VIII — tabela de correlação preenchida").
   Diz o que está correto, o que precisa ser atualizado e o que depende de conferência. Somente leitura:
   não altera os itens, os impostos da nota nem o enquadramento recomendado. */
(function(){
  if (window.V273_CARREGADO) return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const dig=v=>String(v??'').replace(/\D/g,'');
  const real=v=>'R$ '+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
  const num=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;const s=String(v??'').trim();if(!s)return 0;const n=Number(/,/.test(s)?s.replace(/\./g,'').replace(',','.'):s);return Number.isFinite(n)?n:0};
  const ncmFmt=n=>n.length===8?n.slice(0,4)+'.'+n.slice(4,6)+'.'+n.slice(6):n;
  const nbsFmt=n=>n.length===9?n.slice(0,1)+'.'+n.slice(1,5)+'.'+n.slice(5,7)+'.'+n.slice(7):n;
  const unicos=l=>[...new Set(l.filter(Boolean))];
  const hoje=()=>new Date().toISOString().slice(0,10);
  const STATUS={CORRETO:'CORRETO',ATUALIZAR:'ATUALIZAR',CONFERIR:'CONFERIR',SEM:'SEM IBS/CBS NO DOCUMENTO'};
  const ORDEM=[STATUS.ATUALIZAR,STATUS.CONFERIR,STATUS.SEM,STATUS.CORRETO];
  const CLS={[STATUS.CORRETO]:'ok',[STATUS.ATUALIZAR]:'ruim',[STATUS.CONFERIR]:'conf',[STATUS.SEM]:'sem'};
  const LEITURA={[STATUS.CORRETO]:'CST e cClassTrib do documento batem com a relação',[STATUS.ATUALIZAR]:'Documento ou cadastro diverge da relação',
    [STATUS.CONFERIR]:'Depende da operação ou de confirmação do item',[STATUS.SEM]:'Documento sem CST e cClassTrib de IBS/CBS'};

  const campo=(r,sufixo)=>typeof campoGrupo==='function'?campoGrupo(r,'IBS',sufixo):'';
  function doDocumento(r){
    const n=r.dados_nfse||{};
    const cst=dig(campo(r,'CST')||r.cst_ibs_cbs||n.cst_ibs_cbs),cc=dig(campo(r,'cClassTrib')||r.cclasstrib||n.cclasstrib);
    return {cst:cst?cst.padStart(3,'0'):'',cc:cc?cc.padStart(6,'0'):''};
  }
  function classeOficial(cc){
    const cl=window.classificadorReferenciaClasse?.(cc)?.classificacao;if(!cl)return null;
    const fim=String(cl.DthFimVig||'').slice(0,10);
    return {cst:String(cl.Cst||cc.slice(0,3)),nome:String(cl.NomeReduzido||cl.NomeClassTrib||'').trim(),encerrado:!!fim&&fim<hoje(),fim,red:Number(cl.PercRedIbs)||0,nfse:cl.IndNfse};
  }
  const vigente=x=>{const h=hoje(),i=String(x?.DthIniVig||'').slice(0,10),f=String(x?.DthFimVig||'').slice(0,10);return(!i||i<=h)&&(!f||f>=h)};
  /* vínculos oficiais vigentes do NCM (Portal CST/cClassTrib) — usados só para confirmar ou alertar */
  function vinculosNcm(ncm){
    const l=window.classificadorReferenciaPortal?.('NCM',ncm)||[];
    return l.filter(x=>x.vinculo?.TipoPermissao!=='VEDADO'&&vigente(x.vinculo)&&vigente(x.classificacao)).map(x=>({cc:String(x.classificacao?.CodClassTrib||x.vinculo?.cClassTrib||''),anexo:x.vinculo?.NroAnexo||''}));
  }
  const nomeClasse=cc=>{const o=classeOficial(cc);return o&&o.nome?cc+' ('+o.nome+')':cc};
  /* conferências que não dependem da relação: existência, vigência e CST do cClassTrib informado */
  function conferirOficial(doc,servico){
    if(!doc.cc)return 'Documento informa o CST '+doc.cst+' sem o cClassTrib; informar o cClassTrib.';
    const of=classeOficial(doc.cc);
    if(!of)return 'cClassTrib '+doc.cc+' não existe na tabela oficial de classificação tributária; corrigir.';
    if(of.encerrado)return 'cClassTrib '+doc.cc+' está com a vigência encerrada na tabela oficial desde '+of.fim.split('-').reverse().join('/')+'; substituir.';
    if(!doc.cst)return 'Documento informa o cClassTrib '+doc.cc+' sem o CST; informar o CST '+of.cst+'.';
    if(doc.cst!==of.cst)return 'CST do documento é '+doc.cst+', mas o cClassTrib '+doc.cc+' pertence ao CST '+of.cst+'; corrigir o CST.';
    if(servico&&of.nfse===false)return 'cClassTrib '+doc.cc+' não é aceito em NFS-e na tabela oficial; substituir.';
    return '';
  }
  const saida=(base,status,acao)=>({...base,status,acao});

  function validarNcm(r){
    const ncm=dig(r.ncm||r.codigo_ncm),doc=doDocumento(r);
    const base={tipo:'NCM',chave:ncm,codigo:ncmFmt(ncm)||'—',servico:'',descricao:'',docCst:doc.cst,docClasse:doc.cc,relCst:'',relClasse:'',anexo:''};
    if(ncm.length!==8)return saida(base,STATUS.ATUALIZAR,'Item sem NCM de 8 dígitos; corrigir o cadastro do produto.');
    const ref=window.classificadorReferenciaNcm?.(ncm)||{};
    if(!ref.descricao||/não encontrad/i.test(ref.descricao))return saida(base,STATUS.ATUALIZAR,'NCM '+ncmFmt(ncm)+' não consta na TIPI - Base Completa; corrigir o NCM do cadastro.');
    const cands=unicos(String(ref.cclasstrib||'').match(/\d{6}/g)||[]),esperados=cands.length?cands:['000001'];
    const anexo=cands.length?String(ref.anexo||'').trim():'Sem anexo — tributação integral';
    Object.assign(base,{descricao:ref.descricao,relClasse:esperados.join(' / '),relCst:unicos(esperados.map(c=>classeOficial(c)?.cst||c.slice(0,3))).join(' / '),anexo});
    const pelaRelacao='CST '+base.relCst+' · cClassTrib '+base.relClasse;
    if(!doc.cst&&!doc.cc)return saida(base,STATUS.SEM,'Ao emitir, usar pela relação: '+pelaRelacao+(cands.length?' (candidatos do capítulo; confirmar o item no anexo).':'.'));
    const erro=conferirOficial(doc,false);if(erro)return saida(base,STATUS.ATUALIZAR,erro);
    const oficiais=vinculosNcm(ncm),of=classeOficial(doc.cc),noPortal=oficiais.find(x=>x.cc===doc.cc);
    const divergeMotor=window.V254_DIVERGENCIAS_MOTOR_NCM&&Object.prototype.hasOwnProperty.call(window.V254_DIVERGENCIAS_MOTOR_NCM,ncm);
    const emRevisao=' NCM com enquadramento em revisão (Motor × Classificador).';
    if(cands.includes(doc.cc)){
      if(divergeMotor)return saida(base,STATUS.CONFERIR,'Bate com a relação.'+emRevisao);
      if(of.red>0&&!noPortal)return saida(base,STATUS.CONFERIR,'Bate com a relação, que é por capítulo; o NCM não consta no vínculo oficial do cClassTrib '+doc.cc+'. Confirmar se o item está no anexo antes de manter a redução.');
      return saida(base,STATUS.CORRETO,'Sem ajuste.'+(cands.length>1?' A relação admite também '+cands.filter(c=>c!==doc.cc).join(' / ')+'; confirmar a hipótese.':''));
    }
    if(doc.cc==='000001'){
      if(!cands.length)return saida(base,divergeMotor?STATUS.CONFERIR:STATUS.CORRETO,divergeMotor?'Bate com a relação.'+emRevisao:'Sem ajuste: tributação integral, e a relação não prevê redução para o NCM.');
      const comAnexo=oficiais.filter(x=>cands.includes(x.cc));
      if(comAnexo.length)return saida(base,STATUS.CONFERIR,'Documento com tributação integral, mas o NCM consta no vínculo oficial do cClassTrib '+unicos(comAnexo.map(x=>x.cc)).join(' / ')+(comAnexo[0].anexo?' (Anexo '+comAnexo[0].anexo+')':'')+'. Confirmar se a redução se aplica.');
      return saida(base,STATUS.CORRETO,'Sem ajuste: tributação integral. A relação lista '+cands.join(' / ')+' só como candidatos do capítulo, e o NCM não consta no vínculo oficial deles.');
    }
    if(noPortal)return saida(base,STATUS.CONFERIR,'O vínculo oficial do NCM prevê o cClassTrib '+doc.cc+(noPortal.anexo?' (Anexo '+noPortal.anexo+')':'')+', mas a relação TIPI - Base Completa não o lista; atualizar a planilha.');
    if(of.cst==='200')return saida(base,STATUS.ATUALIZAR,'cClassTrib '+nomeClasse(doc.cc)+' não é previsto para o NCM. Pela relação: '+pelaRelacao+'.');
    return saida(base,STATUS.CONFERIR,'cClassTrib '+nomeClasse(doc.cc)+' depende da operação, não do NCM; confirmar a hipótese. Pelo NCM, a relação indica '+pelaRelacao+'.');
  }

  const correl=()=>Array.isArray(window.ANEXO_VIII_CORRELACAO)?window.ANEXO_VIII_CORRELACAO:[];
  const chaveServico=v=>{let k=dig(String(v||'').split('/')[0]);if(k.length===6)k=k.slice(0,4);return k.length===3?k.padStart(4,'0'):k};
  const lista6=(l,f)=>{const u=unicos(l.map(f));return u.slice(0,6).join(', ')+(u.length>6?' e mais '+(u.length-6):'')};
  function validarServico(r){
    const n=r.dados_nfse||{},serv=String(n.codigo_servico||r.codigo_servico||r.item_lista_servico||'').trim(),nbs=dig(n.nbs||r.nbs||r.codigo_nbs),doc=doDocumento(r);
    const base={tipo:'NBS',chave:nbs+'|'+chaveServico(serv),codigo:nbs?nbsFmt(nbs):'—',servico:serv,descricao:String(n.descricao_servico||r.descricao_servico||r.descricao_item||'').trim(),docCst:doc.cst,docClasse:doc.cc,relCst:'',relClasse:'',anexo:'Anexo VIII — correlação NBS × serviço'};
    if(!serv&&!nbs)return saida(base,STATUS.ATUALIZAR,'Nota sem código de serviço e sem NBS; informar os dois.');
    const ks=chaveServico(serv),porServico=serv?correl().filter(x=>chaveServico(x.codigo)===ks):[],porNbs=nbs?correl().filter(x=>dig(x.nbs)===nbs):[];
    if(serv&&!porServico.length&&!porNbs.length)return saida(base,STATUS.ATUALIZAR,'Código de serviço '+serv+(nbs?' e NBS '+nbsFmt(nbs)+' não constam':' não consta')+' na relação NBS; conferir o código informado.');
    if(nbs&&!porNbs.length)return saida(base,STATUS.ATUALIZAR,'NBS '+nbsFmt(nbs)+' não consta na relação. NBS previstas para o serviço '+serv+': '+lista6(porServico,x=>x.nbs)+'.');
    const par=serv&&nbs&&porServico.length?porServico.filter(x=>dig(x.nbs)===nbs):null;
    if(par&&!par.length)return saida(base,STATUS.ATUALIZAR,'NBS '+nbsFmt(nbs)+' não corresponde ao código de serviço '+serv+' na relação. NBS previstas para o serviço: '+lista6(porServico,x=>x.nbs)+'. Serviços previstos para a NBS: '+lista6(porNbs,x=>x.codigo)+'.');
    const lista=par||(porServico.length?porServico:porNbs),classes=unicos(lista.map(x=>x.cClassTrib));
    Object.assign(base,{relClasse:classes.join(' / '),relCst:unicos(classes.map(c=>classeOficial(c)?.cst||c.slice(0,3))).join(' / ')});
    if(!base.descricao)base.descricao=lista[0]?.nbsDesc||lista[0]?.servico||'';
    const pelaRelacao='CST '+base.relCst+' · cClassTrib '+base.relClasse;
    if(!nbs)return saida(base,STATUS.ATUALIZAR,'Nota sem NBS; informar. NBS previstas para o serviço '+serv+': '+lista6(porServico,x=>x.nbs)+'.'+(doc.cc?(classes.includes(doc.cc)?' O cClassTrib '+doc.cc+' é previsto para o serviço.':' O cClassTrib '+doc.cc+' não é previsto para o serviço ('+pelaRelacao+').'):''));
    if(!doc.cst&&!doc.cc)return saida(base,STATUS.SEM,'Ao emitir, usar pela relação: '+pelaRelacao+(classes.length>1?' (mais de uma hipótese; confirmar a operação).':'.'));
    const erro=conferirOficial(doc,true);if(erro)return saida(base,STATUS.ATUALIZAR,erro+(classes.includes(doc.cc)&&/NFS-e|encerrada/.test(erro)?' A relação NBS lista este código; atualizar a planilha.':''));
    if(classes.includes(doc.cc))return saida(base,STATUS.CORRETO,'Sem ajuste.'+(classes.length>1?' A relação admite também '+classes.filter(c=>c!==doc.cc).join(' / ')+'; confirmar a hipótese.':''));
    const of=classeOficial(doc.cc);
    if(['000','200'].includes(of.cst))return saida(base,STATUS.ATUALIZAR,'cClassTrib '+nomeClasse(doc.cc)+' não é previsto para o serviço '+(serv||'')+' com a NBS '+nbsFmt(nbs)+'. Pela relação: '+pelaRelacao+'.');
    return saida(base,STATUS.CONFERIR,'cClassTrib '+nomeClasse(doc.cc)+' depende da operação, não da NBS; confirmar a hipótese. Pela NBS, a relação indica '+pelaRelacao+'.');
  }

  function validar(r){
    r=r||{};const servico=!!window.classificadorV251EhNfse?.(r);
    const v=servico?validarServico(r):validarNcm(r);
    return {...v,valor:num(r.valor_item||r.dados_nfse?.valor_servico)};
  }
  /* agrupa por código + o que o documento informa + situação; a ordem põe primeiro o que exige ação */
  function resumir(itens){
    const totais={};ORDEM.forEach(s=>totais[s]={itens:0,valor:0,codigos:new Set});
    const grupos=new Map,porItem=[];
    for(const r of itens||[]){
      const v=validar(r);porItem.push(v);
      const t=totais[v.status];t.itens++;t.valor+=v.valor;t.codigos.add(v.tipo+v.chave);
      const k=[v.tipo,v.chave,v.docCst,v.docClasse,v.status,v.acao].join('|');
      let g=grupos.get(k);if(!g){g={...v,itens:0,valor:0};grupos.set(k,g)}
      g.itens++;g.valor+=v.valor;
    }
    const lista=[...grupos.values()].sort((a,b)=>ORDEM.indexOf(a.status)-ORDEM.indexOf(b.status)||b.valor-a.valor||a.codigo.localeCompare(b.codigo));
    const arred=x=>Math.round(x*100)/100;lista.forEach(g=>g.valor=arred(g.valor));
    return {total:porItem.length,totais:Object.fromEntries(ORDEM.map(s=>[s,{itens:totais[s].itens,valor:arred(totais[s].valor),codigos:totais[s].codigos.size}])),grupos:lista,porItem};
  }

  const st=document.createElement('style');st.id='v273-style';st.textContent=`
#v273-validacao{margin-bottom:12px}
#v273-validacao h2{margin:0 0 4px;font:700 17px system-ui;color:#0F2A4A}
#v273-validacao .v273-sub{margin:0 0 10px;font:12.5px/1.5 system-ui;color:#42566B}
.v273-tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin-bottom:12px}
.v273-tile{display:flex;flex-direction:column;justify-content:flex-start;align-items:stretch;border:1px solid #C6C6C6;border-top:4px solid #8D8D8D;background:#fff;padding:9px 12px;cursor:pointer;text-align:left;font:inherit;color:inherit;border-radius:0;height:auto;min-height:0}
.v273-tile.ativo{outline:2px solid #F26B21;outline-offset:-2px}
.v273-tile.ok{border-top-color:#24A148}.v273-tile.ruim{border-top-color:#DA1E28}.v273-tile.conf{border-top-color:#F1C21B}.v273-tile.sem{border-top-color:#8D8D8D}
.v273-tile span{display:block;font:700 11px system-ui;letter-spacing:.04em;color:#393939}
.v273-tile b{display:block;margin:3px 0 1px;font:700 22px system-ui;color:#0F2A4A;font-variant-numeric:tabular-nums}
.v273-tile small{display:block;font:11.5px/1.45 system-ui;color:#525252}
.v273-barra{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font:12.5px system-ui;color:#42566B}
.v273-barra button{margin-left:auto}
#v273Tabela{width:100%;min-width:0!important;border-collapse:collapse;font-size:12px}
#v273Tabela th{background:#E0E0E0;color:#161616;text-align:left;padding:7px 9px;border:1px solid #C6C6C6;white-space:nowrap}
#v273Tabela td{padding:6px 9px;border:1px solid #E0E0E0;vertical-align:top;color:#161616}
#v273Tabela td.n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
#v273Tabela td.c{white-space:nowrap}
#v273Tabela td.a{min-width:230px;line-height:1.45;white-space:normal!important}
#v273Tabela td.s{width:118px}
#v273Tabela td.s .v273-tag{white-space:normal;line-height:1.3}
#v273Tabela td small{display:block;color:#525252;line-height:1.4;white-space:normal}
#v273Tabela td.d{min-width:110px;max-width:200px;white-space:normal!important}
.v273-wrap{max-height:460px;overflow:auto;border:1px solid #C6C6C6}
.v273-tag{display:inline-block;padding:2px 7px;font:700 10.5px system-ui;white-space:nowrap}
.v273-tag.ok{background:#DEFBE6;color:#0E6027}.v273-tag.ruim{background:#FFD7D9;color:#A2191F}.v273-tag.conf{background:#FCF4D6;color:#684E00}.v273-tag.sem{background:#E0E0E0;color:#393939}
td.v273-col small{display:block;margin-top:4px;white-space:normal;min-width:260px;line-height:1.4;color:#42566B}
@media print{.v273-wrap{max-height:none!important;overflow:visible!important}.v273-barra{display:none!important}}`;
  document.head.appendChild(st);

  let filtro='';
  const tag=s=>'<span class="v273-tag '+CLS[s]+'">'+esc(s)+'</span>';
  const docTxt=v=>v.docCst||v.docClasse?(v.docCst||'—')+' / '+(v.docClasse||'—'):'não informado';
  const relTxt=v=>v.relCst||v.relClasse?(v.relCst||'—')+' / '+(v.relClasse||'—'):'—';
  function htmlCartao(res){
    const tiles=ORDEM.map(s=>{const t=res.totais[s];return '<button type="button" class="v273-tile '+CLS[s]+(filtro===s?' ativo':'')+'" data-v273-filtro="'+esc(s)+'" title="Mostrar só esta situação"><span>'+esc(s)+'</span><b>'+t.itens+'</b><small>'+t.codigos+' código(s) · '+real(t.valor)+'<br>'+esc(LEITURA[s])+'</small></button>'}).join('');
    const linhas=res.grupos.filter(g=>!filtro||g.status===filtro);
    return '<h2>Validação do CST e do cClassTrib — NCM e NBS</h2>'
      +'<p class="v273-sub">Compara o CST e o cClassTrib de IBS/CBS de cada item do documento com a relação de NCM (TIPI - Base Completa) e com a relação de NBS × código de serviço. '+res.total+' item(ns) analisado(s). A relação de NCM é por capítulo: indica candidatos, e o item precisa constar no anexo.</p>'
      +'<div class="v273-tiles">'+tiles+'</div>'
      +'<div class="v273-barra"><span>'+(filtro?'Mostrando: <b>'+esc(filtro)+'</b> · '+linhas.length+' linha(s). Clique de novo no quadro para ver todas.':linhas.length+' linha(s), uma por código e situação; primeiro o que exige ação.')+'</span><button type="button" class="secondary" id="v273-exportar">⬇ Exportar validação em Excel</button></div>'
      +'<div class="v273-wrap"><table id="v273Tabela"><thead><tr><th>Situação</th><th>NCM ou NBS</th><th>Descrição</th><th>Itens</th><th>Valor</th><th>No documento<br>CST / cClassTrib</th><th>Na relação<br>CST / cClassTrib</th><th>O que fazer</th></tr></thead><tbody>'
      +(linhas.length?linhas.map(g=>'<tr><td class="s">'+tag(g.status)+'</td><td class="c"><b>'+esc(g.tipo)+'</b> '+esc(g.codigo)+(g.servico?'<small>Serviço '+esc(g.servico)+'</small>':'')+'</td><td class="d">'+esc(g.descricao||'—')+'</td><td class="n">'+g.itens+'</td><td class="n">'+real(g.valor)+'</td><td class="c">'+esc(docTxt(g))+'</td><td>'+esc(relTxt(g))+(g.anexo?'<small>'+esc(g.anexo)+'</small>':'')+'</td><td class="a">'+esc(g.acao)+'</td></tr>').join(''):'<tr><td colspan="8">Nenhuma linha nesta situação.</td></tr>')
      +'</tbody></table></div>';
  }
  let ultimo=null;
  function colunas(sec,res){
    const tb=sec.querySelector('.v180-enquadramento .v180-scroll table');if(!tb||tb.dataset.v273)return;
    tb.dataset.v273='1';   /* marca antes: evita remontar em laço se as linhas não baterem */
    const trs=tb.tBodies[0]?[...tb.tBodies[0].rows]:[];if(trs.length!==res.porItem.length)return;
    const ths=tb.tHead.rows[0].cells,ref=ths[4];
    ref.insertAdjacentHTML('afterend','<th>CST / cClassTrib no documento</th><th>Validação NCM/NBS</th>');
    trs.forEach((tr,i)=>{const v=res.porItem[i],c=tr.cells[4];if(!c)return;
      c.insertAdjacentHTML('afterend','<td class="v273-col">'+esc(docTxt(v))+'</td><td class="v273-col">'+tag(v.status)+'<small>'+esc(v.acao)+'</small></td>')});
  }
  function render(){
    const sec=document.getElementById('observacoes');if(!sec)return;
    const alvo=sec.querySelector('.v180-enquadramento');if(!alvo)return;
    const itens=typeof state!=='undefined'&&state.items||[];
    let card=document.getElementById('v273-validacao');
    if(!itens.length){if(card)card.remove();return}
    const res=ultimo=resumir(itens);
    if(!card){card=document.createElement('div');card.className='card';card.id='v273-validacao'}
    if(card.nextElementSibling!==alvo)alvo.insertAdjacentElement('beforebegin',card);
    card.innerHTML=htmlCartao(res);
    colunas(sec,res);
  }
  function exportar(){
    if(!ultimo||typeof gerarXlsx!=='function')return;
    const itens=typeof state!=='undefined'&&state.items||[],f=l=>typeof window.v253FormatarExport==='function'?window.v253FormatarExport(l):l;
    const linha=v=>({situacao:v.status,tipo:v.tipo,codigo:v.codigo,servico:v.servico,descricao:v.descricao,cst_documento:v.docCst,cclasstrib_documento:v.docClasse,cst_relacao:v.relCst,cclasstrib_relacao:v.relClasse,anexo_relacao:v.anexo,o_que_fazer:v.acao});
    const resumo=ORDEM.map(s=>({situacao:s,leitura:LEITURA[s],itens:ultimo.totais[s].itens,codigos:ultimo.totais[s].codigos,valor:ultimo.totais[s].valor}));
    const porCodigo=ultimo.grupos.map(g=>({...linha(g),itens:g.itens,valor:g.valor}));
    const porItem=ultimo.porItem.map((v,i)=>{const r=itens[i]||{};return {documento:r.numero_documento||'',chave:r.chave_documento||r.chave_nota_fiscal||'',codigo_item:r.codigo_produto||r.cProd||'',descricao_item:r.descricao_item||r.descricao_produto||r.dados_nfse?.descricao_servico||'',...linha(v),valor:v.valor}});
    gerarXlsx('VALIDACAO_NCM_NBS_'+new Date().toISOString().slice(0,10)+'.xlsx',[['Resumo da validação',f(resumo)],['Validação por código',f(porCodigo)],['Validação por item',f(porItem)]]);
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('[data-v273-filtro]');
    if(t){filtro=filtro===t.dataset.v273Filtro?'':t.dataset.v273Filtro;const c=document.getElementById('v273-validacao');if(c&&ultimo)c.innerHTML=htmlCartao(ultimo);return}
    if(e.target.id==='v273-exportar')exportar();
  });
  /* a aba é remontada por inteiro a cada abertura ou troca de ano; a validação é recolocada quando isso acontece */
  const sec=document.getElementById('observacoes');
  if(sec&&typeof MutationObserver==='function'){
    let pendente=false;
    new MutationObserver(()=>{
      if(pendente)return;
      const a=sec.querySelector('.v180-enquadramento'),tb=a&&a.querySelector('.v180-scroll table');
      if(a&&(!document.getElementById('v273-validacao')||(tb&&!tb.dataset.v273))){pendente=true;setTimeout(()=>{pendente=false;render()},0)}
    }).observe(sec,{childList:true,subtree:true});
  }
  window.classificadorV273={validar,validarNcm,validarServico,resumir,render,exportar,STATUS};
  window.V273_CARREGADO=true;
})();
