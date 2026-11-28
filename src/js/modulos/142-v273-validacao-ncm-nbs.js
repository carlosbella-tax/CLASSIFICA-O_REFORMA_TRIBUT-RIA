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
  /* V283 — Legenda das situações da tela: o que cada uma representa, quando aparece e o que fazer.
     Dois grupos: a validação do que o documento informa (V273) e o tratamento recomendado por item (V180/V252). */
  const TRATAMENTO={REFERENCIA:'REFERÊNCIA DOCUMENTAL',REVISAO:'REVISÃO NECESSÁRIA',ANALISE:'ANÁLISE NECESSÁRIA'};
  const LEGENDA=[
    {grupo:'Situação',onde:'quadros coloridos, coluna Situação da tabela de validação e coluna Validação NCM/NBS da tabela de itens',
     explica:'Compara o CST e o cClassTrib de IBS/CBS que o documento informa com a relação de NCM (TIPI - Base Completa) e com a relação de NBS × código de serviço.',
     itens:[
      {situacao:STATUS.ATUALIZAR,
       representa:'Há um erro ou uma falta no NCM, na NBS, no CST ou no cClassTrib do item, e é preciso corrigir.',
       quando:'NCM sem 8 dígitos ou que não consta na TIPI; cClassTrib que não existe na tabela oficial, com vigência encerrada, de outro CST ou não aceito no tipo de documento; CST sem cClassTrib, ou o contrário; cClassTrib de alíquota reduzida que a relação não prevê para o NCM; cClassTrib de tributação integral ou de alíquota reduzida que a relação não prevê para o serviço; nota de serviço sem NBS ou sem código de serviço e NBS, ou com NBS e código de serviço que não constam na relação ou não se correspondem.',
       fazer:'Corrigir o cadastro do item ou a emissão do documento. A coluna O que fazer traz o motivo e, quando há, o CST e o cClassTrib indicados pela relação.'},
      {situacao:STATUS.CONFERIR,
       representa:'A relação sozinha não decide o enquadramento: ele depende da operação ou de confirmar o item no anexo da lei.',
       quando:'cClassTrib que depende da operação, e não do NCM ou da NBS; redução que bate com a relação, feita por capítulo, sem o NCM constar no vínculo oficial do cClassTrib; tributação integral em NCM que consta no vínculo oficial de outro cClassTrib listado na relação; NCM com enquadramento em revisão (Motor × Classificador); cClassTrib previsto no vínculo oficial e ausente da relação TIPI - Base Completa.',
       fazer:'Confirmar a hipótese com a operação e com o anexo da LC 214/2025 antes de manter ou trocar o código.'},
      {situacao:STATUS.SEM,
       representa:'O documento não informa CST nem cClassTrib de IBS/CBS, então não há o que comparar. Não indica acerto nem erro.',
       quando:'Item com NCM ou NBS válido, em documento sem os campos de IBS/CBS preenchidos. Se o NCM ou a NBS tiver problema, o item aparece em ATUALIZAR.',
       fazer:'Usar na emissão o CST e o cClassTrib indicados pela relação, mostrados na coluna O que fazer. Com mais de uma hipótese, confirmar a operação.'},
      {situacao:STATUS.CORRETO,
       representa:'O CST e o cClassTrib do documento batem com a relação e passam nas conferências da tabela oficial.',
       quando:'cClassTrib previsto na relação para o NCM, ou para a NBS e o código de serviço; código existente, vigente, do mesmo CST informado e aceito no tipo de documento. Inclui a tributação integral (000001) quando não há redução confirmada para o NCM.',
       fazer:'Nenhum ajuste. Se a relação admitir outro cClassTrib para o mesmo código, a coluna O que fazer pede para confirmar a hipótese.'}]},
    {grupo:'Tratamento IBS/CBS',onde:'coluna Tratamento IBS/CBS da tabela Enquadramento recomendado, item a item',
     explica:'Mostra se o sistema conseguiu recomendar um CST e um cClassTrib pelo NCM, pela NBS ou pelo código de serviço. Não depende do que o documento informa.',
     itens:[
      {situacao:TRATAMENTO.REFERENCIA,
       representa:'Há uma única hipótese vigente e não vedada para o código. O sistema recomenda o CST e o cClassTrib e, nos CST 000 e 200, calcula a alíquota final.',
       quando:'NCM, NBS ou código de serviço com um só enquadramento aplicável na referência de CST e cClassTrib.',
       fazer:'Confirmar condição, exceção, operação e vigência antes do enquadramento definitivo.'},
      {situacao:TRATAMENTO.REVISAO,
       representa:'Há mais de uma hipótese possível, ou a hipótese encontrada tem restrição. O sistema não escolhe por conta própria.',
       quando:'Código com mais de um enquadramento aplicável; serviço com hipótese vedada ou fora de vigência; NCM em que o Motor e o Classificador apontam anexos diferentes.',
       fazer:'Definir a hipótese pela operação e pelo anexo. Até lá, a alíquota final aparece como A confirmar.'},
      {situacao:TRATAMENTO.ANALISE,
       representa:'O sistema não encontrou enquadramento documentado para o item; não há CST nem cClassTrib recomendados.',
       quando:'Item sem NCM, NBS ou código de serviço, ou código sem vínculo vigente na referência consultada.',
       fazer:'Conferir o código do item e analisar o enquadramento na LC 214/2025.'}]}];
  const LEGENDA_NOTA='A validação é somente leitura: não altera os documentos, os impostos da nota nem o enquadramento recomendado.';
  /* a mesma legenda, em linhas, para as planilhas do Excel */
  const legendaLinhas=()=>LEGENDA.flatMap(g=>g.itens.map(i=>({'Onde aparece':g.grupo+' — '+g.onde,'Situação':i.situacao,'O que representa':i.representa,'Quando aparece':i.quando,'O que fazer':i.fazer})));

  const campo=(r,sufixo)=>typeof campoGrupo==='function'?campoGrupo(r,'IBS',sufixo):'';
  function doDocumento(r){
    const n=r.dados_nfse||{};
    const cst=dig(campo(r,'CST')||r.cst_ibs_cbs||n.cst_ibs_cbs),cc=dig(campo(r,'cClassTrib')||r.cclasstrib||n.cclasstrib);
    return {cst:cst?cst.padStart(3,'0'):'',cc:cc?cc.padStart(6,'0'):''};
  }
  /* V274 — CST (coluna A), Descrição CST-IBS/CBS (coluna B) e cClassTrib (coluna C) vêm da Tabela IT 2025.002;
     o Portal CST/cClassTrib só é usado se o código não estiver na tabela carregada. */
  const ROTULO_DFE={NFeABI:'NF-e ABI',NFe:'NF-e',NFCe:'NFC-e',CTe:'CT-e',CTeOS:'CT-e OS',BPe:'BP-e',BPeTA:'BP-e TA',BPeTM:'BP-e TM',NF3e:'NF3-e',NFSe:'NFS-e',NFSeVia:'NFS-e Via',NFCom:'NFCom',NFAg:'NFAg',NFGas:'NFGas',DERE:'DERE',DIR:'DIR',DUIMP:'DUIMP'};
  const fonteIt=()=>window.IT_2025_002?'Tabela IT 2025.002 v.'+window.IT_2025_002.versao:'';
  const nomeCst=cst=>cst?String(window.IT_2025_002?.csts?.[cst]?.nome||''):'';
  function classeOficial(cc){
    const it=window.classificadorIt2025002?.(cc);
    if(it)return {cst:it.cst,descCst:it.descCst||it.nomeCst,nome:String(it.nome||it.descricao||'').trim(),encerrado:!!it.fim&&it.fim<hoje(),fim:it.fim,red:Number(it.redIbs)||0,docs:it.docs||[],nfse:(it.docs||[]).includes('NFSe')};
    const cl=window.classificadorReferenciaClasse?.(cc)?.classificacao;if(!cl)return null;
    const fim=String(cl.DthFimVig||'').slice(0,10),cst=String(cl.Cst||cc.slice(0,3));
    return {cst,descCst:nomeCst(cst),nome:String(cl.NomeReduzido||cl.NomeClassTrib||'').trim(),encerrado:!!fim&&fim<hoje(),fim,red:Number(cl.PercRedIbs)||0,docs:null,nfse:cl.IndNfse};
  }
  /* documento fiscal do item, na sigla da tabela; vazio quando o modelo não é conhecido (não confere) */
  function tipoDfe(r,servico){
    if(servico)return 'NFSe';
    const m=dig(r.modelo||r.modelo_documento);
    return m==='55'?'NFe':m==='65'?'NFCe':m==='57'?'CTe':m==='67'?'CTeOS':'';
  }
  const vigente=x=>{const h=hoje(),i=String(x?.DthIniVig||'').slice(0,10),f=String(x?.DthFimVig||'').slice(0,10);return(!i||i<=h)&&(!f||f>=h)};
  /* vínculos oficiais vigentes do NCM (Portal CST/cClassTrib) — usados só para confirmar ou alertar */
  function vinculosNcm(ncm){
    const l=window.classificadorReferenciaPortal?.('NCM',ncm)||[];
    return l.filter(x=>x.vinculo?.TipoPermissao!=='VEDADO'&&vigente(x.vinculo)&&vigente(x.classificacao)).map(x=>({cc:String(x.classificacao?.CodClassTrib||x.vinculo?.cClassTrib||''),anexo:x.vinculo?.NroAnexo||''}));
  }
  const nomeClasse=cc=>{const o=classeOficial(cc);return o&&o.nome?cc+' ('+o.nome+')':cc};
  /* conferências que não dependem da relação: existência, vigência e CST do cClassTrib informado */
  function conferirOficial(doc,servico,dfe){
    if(!doc.cc)return 'Documento informa o CST '+doc.cst+' sem o cClassTrib; informar o cClassTrib.';
    const of=classeOficial(doc.cc);
    if(!of)return 'cClassTrib '+doc.cc+' não existe na tabela oficial de classificação tributária; corrigir.';
    if(of.encerrado)return 'cClassTrib '+doc.cc+' está com a vigência encerrada na tabela oficial desde '+of.fim.split('-').reverse().join('/')+'; substituir.';
    if(!doc.cst)return 'Documento informa o cClassTrib '+doc.cc+' sem o CST; informar o CST '+of.cst+'.';
    if(doc.cst!==of.cst)return 'CST do documento é '+doc.cst+', mas o cClassTrib '+doc.cc+' pertence ao CST '+of.cst+'; corrigir o CST.';
    if(servico&&of.nfse===false)return 'cClassTrib '+doc.cc+' não é aceito em NFS-e na tabela oficial'+(of.docs&&of.docs.length?' (aceito em: '+of.docs.map(d=>ROTULO_DFE[d]||d).join(', ')+')':'')+'; substituir.';
    if(!servico&&dfe&&of.docs&&!of.docs.includes(dfe))return 'cClassTrib '+nomeClasse(doc.cc)+' não é aceito em '+ROTULO_DFE[dfe]+' na tabela oficial'+(of.docs.length?' (aceito em: '+of.docs.map(d=>ROTULO_DFE[d]||d).join(', ')+')':'')+'; substituir.';
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
    const erro=conferirOficial(doc,false,tipoDfe(r,false));if(erro)return saida(base,STATUS.ATUALIZAR,erro);
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
    const of=v.docClasse?classeOficial(v.docClasse):null;
    const docDescCst=of&&(!v.docCst||v.docCst===of.cst)?of.descCst:nomeCst(v.docCst);
    const relDescCst=unicos((String(v.relClasse||'').match(/\d{6}/g)||[]).map(c=>classeOficial(c)?.descCst||'')).join(' / ');
    return {...v,docDescCst:docDescCst||'',relDescCst,valor:num(r.valor_item||r.dados_nfse?.valor_servico)};
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
td.v273-col:nth-of-type(6) small{min-width:150px}
small.v274-desc{display:block;margin-top:4px;white-space:normal;min-width:120px;line-height:1.4;color:#42566B}
.v283-legenda{margin:0 0 12px;border:1px solid #C6C6C6;border-left:4px solid #0F2A4A;background:#fff}
.v283-cab{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 12px;background:#F4F4F4}
.v283-cab b{font:700 13.5px system-ui;color:#0F2A4A}
.v283-cab span{flex:1 1 320px;font:12px/1.45 system-ui;color:#42566B}
.v283-cab button{margin-left:auto;padding:5px 10px;font-size:12px}
.v283-corpo{padding:4px 12px 10px}
.v283-legenda.fechada .v283-corpo{display:none}
.v283-grupo{margin:8px 0 5px;font:12.5px/1.5 system-ui;color:#42566B}
.v283-grupo b{color:#0F2A4A}
table.v283-t{width:100%!important;min-width:0!important;table-layout:fixed!important;border-collapse:collapse!important;font-size:12px}
table.v283-t th,table.v283-t td{position:static!important;border:1px solid #E0E0E0!important;padding:6px 9px!important;text-align:left!important;vertical-align:top!important;white-space:normal!important;overflow-wrap:break-word;line-height:1.45!important;color:#161616!important;max-width:none!important;min-width:0!important}
table.v283-t th{background:#E0E0E0!important;border-color:#C6C6C6!important;font-weight:700}
table.v283-t td{background:#fff!important}
table.v283-t th:nth-child(1){width:15%}table.v283-t th:nth-child(2){width:24%}table.v283-t th:nth-child(3){width:37%}table.v283-t th:nth-child(4){width:24%}
table.v283-t td:first-child b{font:700 11.5px system-ui;color:#0F2A4A}
table.v283-t .v273-tag{white-space:normal;line-height:1.3}
@media(max-width:900px){table.v283-t,table.v283-t tbody,table.v283-t tr,table.v283-t td{display:block!important;width:auto!important}table.v283-t thead{display:none!important}table.v283-t tr{border:1px solid #C6C6C6;margin-bottom:6px}table.v283-t td{border:0!important;padding:4px 9px!important}table.v283-t td[data-v283-rot]:before{content:attr(data-v283-rot) ": ";font-weight:700;color:#0F2A4A}}
@media print{.v273-wrap{max-height:none!important;overflow:visible!important}.v273-barra,.v283-cab button{display:none!important}.v283-legenda.fechada .v283-corpo{display:block!important}.v283-legenda,table.v283-t tr{break-inside:avoid;page-break-inside:avoid}
/* a impressão antiga força 7px em todas as tabelas; a legenda precisa ser lida no papel */
table.v283-t th,table.v283-t td{font-size:9.5px!important;line-height:1.35!important;padding:3px 6px!important}table.v283-t .v273-tag{font-size:8.5px!important}
.v283-grupo{font-size:10px!important;margin:5px 0 3px!important}.v283-cab{padding:4px 8px!important}.v283-cab b{font-size:11.5px!important}.v283-cab span{font-size:9.5px!important}.v283-corpo{padding:2px 8px 6px!important}}`;
  document.head.appendChild(st);

  let filtro='',legendaAberta=true;
  const tag=s=>'<span class="v273-tag '+CLS[s]+'">'+esc(s)+'</span>';
  function htmlLegenda(){
    const cel=(rot,t)=>'<td data-v283-rot="'+rot+'">'+esc(t)+'</td>';
    return '<div class="v283-legenda'+(legendaAberta?'':' fechada')+'" id="v283-legenda"><div class="v283-cab"><b>Legenda das situações</b><span>O que cada situação desta tela representa, quando aparece e o que fazer. '+esc(LEGENDA_NOTA)+'</span>'
      +'<button type="button" class="secondary" data-v283-alternar aria-expanded="'+legendaAberta+'" aria-controls="v283-corpo">'+(legendaAberta?'Ocultar legenda':'Mostrar legenda')+'</button></div>'
      +'<div class="v283-corpo" id="v283-corpo">'+LEGENDA.map(g=>'<p class="v283-grupo"><b>'+esc(g.grupo)+'</b> — '+esc(g.onde)+'. '+esc(g.explica)+'</p>'
        +'<table class="v283-t"><thead><tr><th>Situação</th><th>O que representa</th><th>Quando aparece</th><th>O que fazer</th></tr></thead><tbody>'
        +g.itens.map(i=>'<tr><td>'+(CLS[i.situacao]?tag(i.situacao):'<b>'+esc(i.situacao)+'</b>')+'</td>'+cel('O que representa',i.representa)+cel('Quando aparece',i.quando)+cel('O que fazer',i.fazer)+'</tr>').join('')
        +'</tbody></table>').join('')+'</div></div>';
  }
  const docTxt=v=>v.docCst||v.docClasse?(v.docCst||'—')+' / '+(v.docClasse||'—'):'não informado';
  const relTxt=v=>v.relCst||v.relClasse?(v.relCst||'—')+' / '+(v.relClasse||'—'):'—';
  function htmlCartao(res){
    const tiles=ORDEM.map(s=>{const t=res.totais[s];return '<button type="button" class="v273-tile '+CLS[s]+(filtro===s?' ativo':'')+'" data-v273-filtro="'+esc(s)+'" title="Mostrar só esta situação"><span>'+esc(s)+'</span><b>'+t.itens+'</b><small>'+t.codigos+' código(s) · '+real(t.valor)+'<br>'+esc(LEITURA[s])+'</small></button>'}).join('');
    const linhas=res.grupos.filter(g=>!filtro||g.status===filtro);
    return '<h2>Validação do CST e do cClassTrib — NCM e NBS</h2>'
      +'<p class="v273-sub">Compara o CST e o cClassTrib de IBS/CBS de cada item do documento com a relação de NCM (TIPI - Base Completa) e com a relação de NBS × código de serviço. '+res.total+' item(ns) analisado(s). A relação de NCM é por capítulo: indica candidatos, e o item precisa constar no anexo.'+(fonteIt()?' CST, descrição do CST, vigência e documentos aceitos de cada cClassTrib: '+esc(fonteIt())+'.':'')+'</p>'
      +'<div class="v273-tiles">'+tiles+'</div>'
      +htmlLegenda()
      +'<div class="v273-barra"><span>'+(filtro?'Mostrando: <b>'+esc(filtro)+'</b> · '+linhas.length+' linha(s). Clique de novo no quadro para ver todas.':linhas.length+' linha(s), uma por código e situação; primeiro o que exige ação.')+'</span><button type="button" class="secondary" id="v273-exportar">⬇ Exportar validação em Excel</button></div>'
      +'<div class="v273-wrap"><table id="v273Tabela"><thead><tr><th>Situação</th><th>NCM ou NBS</th><th>Descrição</th><th>Itens</th><th>Valor</th><th>No documento<br>CST / cClassTrib<br>Descrição do CST</th><th>Na relação<br>CST / cClassTrib<br>Descrição do CST</th><th>O que fazer</th></tr></thead><tbody>'
      +(linhas.length?linhas.map(g=>'<tr><td class="s">'+tag(g.status)+'</td><td class="c"><b>'+esc(g.tipo)+'</b> '+esc(g.codigo)+(g.servico?'<small>Serviço '+esc(g.servico)+'</small>':'')+'</td><td class="d">'+esc(g.descricao||'—')+'</td><td class="n">'+g.itens+'</td><td class="n">'+real(g.valor)+'</td><td>'+esc(docTxt(g))+(g.docDescCst?'<small>'+esc(g.docDescCst)+'</small>':'')+'</td><td>'+esc(relTxt(g))+(g.relDescCst?'<small><b>'+esc(g.relDescCst)+'</b></small>':'')+(g.anexo?'<small>'+esc(g.anexo)+'</small>':'')+'</td><td class="a">'+esc(g.acao)+'</td></tr>').join(''):'<tr><td colspan="8">Nenhuma linha nesta situação.</td></tr>')
      +'</tbody></table></div>';
  }
  let ultimo=null;
  function colunas(sec,res){
    const tb=sec.querySelector('.v180-enquadramento .v180-scroll table');if(!tb||tb.dataset.v273)return;
    tb.dataset.v273='1';   /* marca antes: evita remontar em laço se as linhas não baterem */
    const trs=tb.tBodies[0]?[...tb.tBodies[0].rows]:[];if(trs.length!==res.porItem.length)return;
    /* descrição do CST (Tabela IT 2025.002) abaixo da CST recomendada, quando há cClassTrib recomendado */
    trs.forEach(tr=>{const c=tr.cells[3],k=tr.cells[4];if(!c||!k)return;const d=unicos((k.textContent.match(/\d{6}/g)||[]).map(x=>classeOficial(x)?.descCst||''));if(d.length)c.insertAdjacentHTML('beforeend','<small class="v274-desc">'+esc(d.join(' / '))+'</small>')});
    const ths=tb.tHead.rows[0].cells,ref=ths[4];
    ref.insertAdjacentHTML('afterend','<th>CST / cClassTrib no documento</th><th>Validação NCM/NBS</th>');
    trs.forEach((tr,i)=>{const v=res.porItem[i],c=tr.cells[4];if(!c)return;
      c.insertAdjacentHTML('afterend','<td class="v273-col">'+esc(docTxt(v))+(v.docDescCst?'<small>'+esc(v.docDescCst)+'</small>':'')+'</td><td class="v273-col">'+tag(v.status)+'<small>'+esc(v.acao)+'</small></td>')});
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
    const linha=v=>({situacao:v.status,tipo:v.tipo,codigo:v.codigo,servico:v.servico,descricao:v.descricao,cst_documento:v.docCst,descricao_cst_documento:v.docDescCst,cclasstrib_documento:v.docClasse,cst_relacao:v.relCst,descricao_cst_relacao:v.relDescCst,cclasstrib_relacao:v.relClasse,anexo_relacao:v.anexo,o_que_fazer:v.acao});
    const resumo=ORDEM.map(s=>({situacao:s,leitura:LEITURA[s],itens:ultimo.totais[s].itens,codigos:ultimo.totais[s].codigos,valor:ultimo.totais[s].valor}));
    const porCodigo=ultimo.grupos.map(g=>({...linha(g),itens:g.itens,valor:g.valor}));
    const porItem=ultimo.porItem.map((v,i)=>{const r=itens[i]||{};return {documento:r.numero_documento||'',chave:r.chave_documento||r.chave_nota_fiscal||'',codigo_item:r.codigo_produto||r.cProd||'',descricao_item:r.descricao_item||r.descricao_produto||r.dados_nfse?.descricao_servico||'',...linha(v),valor:v.valor}});
    gerarXlsx('VALIDACAO_NCM_NBS_'+new Date().toISOString().slice(0,10)+'.xlsx',[['Resumo da validação',f(resumo)],['Validação por código',f(porCodigo)],['Validação por item',f(porItem)],['Legenda das situações',legendaLinhas()]]);
  }
  document.addEventListener('click',e=>{
    const t=e.target.closest&&e.target.closest('[data-v273-filtro]');
    if(t){filtro=filtro===t.dataset.v273Filtro?'':t.dataset.v273Filtro;const c=document.getElementById('v273-validacao');if(c&&ultimo)c.innerHTML=htmlCartao(ultimo);return}
    if(e.target.id==='v273-exportar')exportar();
    if(e.target.closest&&e.target.closest('[data-v283-alternar]')){legendaAberta=!legendaAberta;const c=document.getElementById('v273-validacao');if(c&&ultimo)c.innerHTML=htmlCartao(ultimo)}
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
  window.classificadorV273={classeOficial,tipoDfe,validar,validarNcm,validarServico,resumir,render,exportar,STATUS,TRATAMENTO,LEGENDA,LEGENDA_NOTA,legendaLinhas};
  window.V273_CARREGADO=true;
})();
