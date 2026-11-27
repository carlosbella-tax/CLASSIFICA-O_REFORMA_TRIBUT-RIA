/* V277 — Cálculo 2026 a 2033 por item. Tela própria, no menu logo depois de "Base de IBS/CBS".
   Para cada item dos documentos (NCM ou NBS/serviço) mostra:
   - o que é praticado hoje: ICMS, ISS, IPI, PIS e COFINS destacados no documento;
   - a base de IBS/CBS: valor do item − ICMS − ISS − PIS − COFINS;
   - a projeção de 2026 a 2033: CBS, IBS estadual e IBS municipal pelas alíquotas do cronograma, com a
     redução do cClassTrib/CST do item; PIS e COFINS extintos em 2027; IPI com alíquota zero a partir de
     2027; ICMS e ISS reduzidos de 2029 a 2032 e extintos em 2033.
   CST e cClassTrib vêm do documento quando ele informa um código válido (Tabela IT 2025.002); senão, da
   relação de NCM (TIPI) ou de NBS e serviços, pelo mesmo motor das telas Análise por NCM e Apuração.
   Somente leitura: não altera os itens, os impostos da nota nem o enquadramento. */
(function(){
  if (window.V277_CARREGADO) return;
  const ANOS=[2026,2027,2028,2029,2030,2031,2032,2033];
  const PADRAO={cbs:[0.9,11.3,11.3,11.3,11.3,11.3,11.3,11.3],ibsE:[0.1,0.05,0.05,1.6,3.2,4.8,6.48,16.2],ibsM:[0,0.05,0.05,0.25,0.5,0.75,1,2.5],redAnt:[0,0,0,10,20,30,40,100]};
  const ROTULO_CRONO={cbs:'CBS (%)',ibsE:'IBS Estadual (%)',ibsM:'IBS Municipal (%)',redAnt:'Redução do ICMS (%)'};
  const S={CALC:'CALCULADO',CONF:'CONFERIR',SEM:'SEM IBS/CBS',NAO:'NÃO CALCULADO'};
  const CLS={[S.CALC]:'verde',[S.CONF]:'amarelo',[S.SEM]:'cinza',[S.NAO]:'vermelho'};
  const LEITURA={[S.CALC]:'Enquadramento único; IBS e CBS calculados',[S.CONF]:'Calculado, mas o enquadramento precisa de conferência',
    [S.SEM]:'Isenção, imunidade, suspensão ou diferimento: sem IBS e CBS',[S.NAO]:'Fora do cálculo; o motivo está na coluna Observação'};
  const PAGINA=100;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const dig=v=>String(v??'').replace(/\D/g,'');
  const n2=v=>Math.round((Number(v)||0)*100)/100;
  const fmt=v=>new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
  const real=v=>v===null||v===undefined?'—':(v<0?'-':'')+'R$ '+fmt(Math.abs(v));
  const pct=v=>fmt(v)+'%';
  const inteiro=v=>new Intl.NumberFormat('pt-BR').format(v);
  const numero=v=>{if(typeof v==='number')return Number.isFinite(v)?v:0;if(typeof num==='function')return num(v);const s=String(v??'').trim();const n=Number(/,/.test(s)?s.replace(/\./g,'').replace(',','.'):s);return Number.isFinite(n)?n:0};
  const grupo=(r,g,t)=>typeof valorGrupo==='function'?valorGrupo(r,g,t):0;
  const ncmFmt=n=>n.slice(0,4)+'.'+n.slice(4,6)+'.'+n.slice(6);
  const nbsFmt=n=>n.slice(0,1)+'.'+n.slice(1,5)+'.'+n.slice(5,7)+'.'+n.slice(7);
  const dataBr=s=>{const m=String(s||'').match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[3]+'/'+m[2]+'/'+m[1]:String(s||'')};
  const hoje=()=>new Date().toISOString().slice(0,10);
  const itensCarga=()=>(typeof state!=='undefined'&&state&&Array.isArray(state.items))?state.items:[];

  /* ---------- cronograma: o mesmo da tela "Ver cronograma de alíquotas", lido a cada cálculo ---------- */
  function cronograma(){
    const c={cbs:[...PADRAO.cbs],ibsE:[...PADRAO.ibsE],ibsM:[...PADRAO.ibsM],redAnt:[...PADRAO.redAnt]};
    try{
      const x=JSON.parse(localStorage.getItem('classificador.v168.cronograma')||'null');
      if(x&&x.tabela&&Array.isArray(x.anos)&&x.anos.join()===ANOS.join())
        for(const k in ROTULO_CRONO){const a=x.tabela[ROTULO_CRONO[k]];if(Array.isArray(a))for(let i=0;i<8;i++){const n=Number(a[i]);if(Number.isFinite(n))c[k][i]=n}}
    }catch(e){}
    return c;
  }
  function fase(i,cr){
    if(i===0)return 'Ano de teste: valem os tributos de hoje';
    if(cr.redAnt[i]>=100)return 'IBS integral; ICMS e ISS extintos';
    if(cr.redAnt[i]>0)return 'Transição: ICMS e ISS reduzidos em '+pct(cr.redAnt[i]);
    return i===1?'CBS integral; PIS e COFINS extintos; IPI com alíquota zero':'CBS integral; IBS ainda em teste';
  }

  /* ---------- identificação do item: NCM, NBS ou código de serviço ---------- */
  const ehNfse=r=>typeof window.classificadorV251EhNfse==='function'?!!window.classificadorV251EhNfse(r):/NFS/i.test(String(r.tipo_documento||''));
  function codigoDe(r){
    if(ehNfse(r)){
      const n=r.dados_nfse||{},nbs=dig(n.nbs||r.nbs),serv=String(n.codigo_servico||r.codigo_item||'').trim();
      if(nbs.length>=7){const c=nbs.padStart(9,'0');return {tipo:'NBS',codigo:c,rotulo:'NBS '+nbsFmt(c),servico:serv}}
      return {tipo:'SERVIÇO',codigo:serv,rotulo:serv?'Serviço '+serv:'—',servico:serv};
    }
    const ncm=dig(r.ncm);
    return ncm.length===8?{tipo:'NCM',codigo:ncm,rotulo:'NCM '+ncmFmt(ncm),servico:''}:{tipo:'',codigo:'',rotulo:'—',servico:''};
  }

  /* ---------- enquadramento: CST, cClassTrib e redução usados na projeção ---------- */
  const tabelaIt=cc=>typeof window.classificadorIt2025002==='function'?window.classificadorIt2025002(cc):null;
  const nomeCst=cst=>String((window.IT_2025_002&&window.IT_2025_002.csts&&window.IT_2025_002.csts[cst]||{}).nome||'');
  const cacheRelacao=new Map;
  /* pela relação de NCM (TIPI) ou de NBS e serviços: mesmo motor da Análise por NCM e da Apuração */
  function pelaRelacao(r,c){
    const k=c.tipo+'|'+c.codigo+'|'+c.servico;
    if(cacheRelacao.has(k))return {...cacheRelacao.get(k)};
    let ef=null;
    try{if(typeof window.v253Efeito==='function')ef=c.tipo==='NBS'||c.tipo==='SERVIÇO'?window.v253Efeito(c.tipo,c.codigo,r):window.v253Efeito('NCM',c.codigo)}catch(e){}
    const ref=(ef&&ef.ref)||{},lista=[...new Set(String(ref.classe||'').match(/\d{6}/g)||[])];
    let cc=lista.length===1?lista[0]:'',cst=/^\d{3}$/.test(String(ref.cst||''))?String(ref.cst):'';
    const revisao=!!(ef&&ef.revisao);
    if(!cc&&!lista.length&&!revisao&&(cst==='000'||!cst)){cc='000001';cst='000'}
    const red=ref.reducao===null||ref.reducao===undefined?0:(Number(ref.reducao)||0);
    const it=cc?tabelaIt(cc):null;
    const e={origem:c.tipo==='NCM'?'Relação de NCM (TIPI)':c.tipo?'Relação de NBS e serviços':'Sem NCM ou NBS',
      cst:cst||(it?it.cst:'—'),cc:cc||lista.join(' / ')||'—',descCst:(it&&it.descCst)||nomeCst(cst),redIbs:red,redCbs:red,situacao:S.CALC,obs:'',calcula:true,zero:false};
    if(!c.tipo){e.situacao=S.CONF;e.obs='Item sem NCM de 8 dígitos e sem NBS; calculado com tributação integral.'}
    else if(revisao){e.situacao=S.CONF;e.redIbs=e.redCbs=0;e.revisao=true;if(!lista.length)e.descCst='Em revisão';e.obs='Enquadramento em revisão'+(lista.length>1?' (hipóteses: '+lista.join(' / ')+')':'')+'; calculado sem redução.'}
    else if(!cc){e.situacao=S.CONF;e.redIbs=e.redCbs=0;e.obs='Mais de uma hipótese de cClassTrib ('+lista.join(' / ')+'); calculado sem redução.'}
    else if(cc!=='000001'&&!(red>0)){e.situacao=S.CONF;e.obs='cClassTrib '+cc+(it&&Number(it.redIbs)>0?' (redução de '+pct(Number(it.redIbs))+' na tabela)':'')+' indicado pela relação, sem confirmação de que se aplica ao item; calculado sem redução.'}
    cacheRelacao.set(k,e);
    return {...e};
  }
  /* pelo documento: só quando o cClassTrib informado existe na Tabela IT, está vigente e não precisa de ajuste */
  function peloDocumento(v){
    const V=window.classificadorV273,cc=v&&v.docClasse,it=cc?tabelaIt(cc):null;
    if(!V||!it||(it.fim&&it.fim<hoje())||v.status===V.STATUS.ATUALIZAR)return null;
    const cst=String(it.cst||''),t=String(it.tipoAliq||''),desc=it.descCst||nomeCst(cst);
    const e={origem:'Documento',cst,cc,descCst:desc,redIbs:0,redCbs:0,situacao:S.CALC,obs:'',calcula:true,zero:false};
    if(/^Padr/i.test(t)){
      e.redIbs=Number(it.redIbs)||0;e.redCbs=Number(it.redCbs)||0;
      if(cst==='222'){e.situacao=S.CONF;e.obs='CST 222 (redução de base de cálculo): o percentual da redução não está na tabela; calculado sobre a base cheia.'}
      else if(cst==='515'){e.situacao=S.CONF;e.obs='CST 515 (diferimento com redução de alíquota): calculado com a redução; o recolhimento é diferido.'}
    }else if(/^Sem al/i.test(t)){e.zero=true;e.situacao=S.SEM;e.obs=(desc||'CST '+cst)+': operação sem IBS e CBS.'}
    else{e.calcula=false;e.situacao=S.NAO;e.obs='cClassTrib '+cc+' tem alíquota própria ('+t.toLowerCase()+'), fora do cronograma; IBS e CBS não calculados.'}
    if(v.status===V.STATUS.CONFERIR){if(e.situacao===S.CALC)e.situacao=S.CONF;e.obs=(e.obs?e.obs+' ':'')+String(v.acao||'')+(e.calcula&&!e.zero&&(e.redIbs>0||e.redCbs>0)?' Calculado com a redução informada no documento.':'')}
    return e;
  }
  const ehCte=r=>/CT-?e/i.test(String(r.tipo_documento||''));
  function enquadrar(r,c){
    if(ehCte(r))return {origem:'—',cst:'—',cc:'—',descCst:'',redIbs:0,redCbs:0,situacao:S.NAO,calcula:false,zero:false,
      obs:'CT-e: a linha é o documento transportado (valor da carga), não o frete. O valor do frete e o ICMS do transporte não são lidos por item; fora do cálculo.'};
    let v=null;try{v=window.classificadorV273?window.classificadorV273.validar(r):null}catch(x){}
    const doc=v?peloDocumento(v):null;if(doc)return doc;
    const e=pelaRelacao(r,c);
    /* em revisão e sem hipótese no motor: mostra os códigos que a relação de NCM/NBS lista para o item */
    if(e.revisao&&e.cc==='—'&&v&&v.relClasse){e.cc=v.relClasse;e.cst=v.relCst||'—';e.descCst=v.relDescCst||'Em revisão';e.obs='Enquadramento em revisão (a relação lista '+v.relClasse+'); calculado sem redução.'}
    if(v&&(v.docClasse||v.docCst))e.obs='Documento informa '+[v.docCst&&'CST '+v.docCst,v.docClasse&&'cClassTrib '+v.docClasse].filter(Boolean).join(' e ')+', que precisa de ajuste (ver Enquadramento recomendado); projeção feita pela relação.'+(e.obs?' '+e.obs:'');
    return e;
  }

  /* ---------- cálculo de um item ---------- */
  function calcular(r,cr){
    r=r||{};cr=cr||cronograma();
    const c=codigoDe(r),e=enquadrar(r,c),n=r.dados_nfse||{};
    const valor=n2(numero(r.valor_item||n.valor_servico));
    const icms=n2(typeof valorIcms==='function'?valorIcms(r,'vICMS'):0),iss=n2(grupo(r,'ISSQN','vISSQN')||numero(n.valor_iss));
    const ipi=n2(grupo(r,'IPI','vIPI')),pis=n2(grupo(r,'PIS','vPIS')),cofins=n2(grupo(r,'COFINS','vCOFINS'));
    const hojeT=n2(icms+iss+ipi+pis+cofins),base=n2(Math.max(0,valor-icms-iss-pis-cofins));
    const fIbs=!e.calcula||e.zero?0:Math.max(0,1-e.redIbs/100),fCbs=!e.calcula||e.zero?0:Math.max(0,1-e.redCbs/100);
    const anos=ANOS.map((ano,i)=>{
      const aliqCbs=cr.cbs[i]*fCbs,aliqIbsE=cr.ibsE[i]*fIbs,aliqIbsM=cr.ibsM[i]*fIbs,fAnt=Math.max(0,1-cr.redAnt[i]/100);
      const cbs=n2(base*aliqCbs/100),ibsE=n2(base*aliqIbsE/100),ibsM=n2(base*aliqIbsM/100),ibscbs=n2(cbs+ibsE+ibsM);
      const icmsA=n2(icms*fAnt),issA=n2(iss*fAnt),ipiA=i?0:ipi,pisA=i?0:pis,cofinsA=i?0:cofins;
      /* 2026: IBS e CBS de teste são compensados com PIS e COFINS e não somam à carga do ano */
      const carga=n2(icmsA+issA+ipiA+pisA+cofinsA+(i?ibscbs:0));
      return {ano,aliqCbs,aliqIbsE,aliqIbsM,cbs,ibsE,ibsM,ibscbs,icms:icmsA,iss:issA,ipi:ipiA,pis:pisA,cofins:cofinsA,carga,diferenca:n2(carga-hojeT)};
    });
    const op=String((typeof tipoOperacao==='function'?tipoOperacao(r):r.tipo_operacao)||'').toUpperCase();
    return {documento:String(r.numero_documento||''),emissao:dataBr(r.data_emissao),operacao:/^SA/.test(op)?'Saída':'Entrada',item:String(r.numero_item??''),
      emitente:String(r.emitente_razao_social||''),destinatario:String(r.destinatario_razao_social||''),chave:dig(r.chave_documento)||String(r.numero_documento||'')+'|'+dig(r.emitente_cnpj_cpf),
      tipo:c.tipo,codigo:c.codigo,rotulo:c.rotulo,servico:c.servico,descricao:String(r.descricao_item||n.descricao_servico||'').trim(),cfop:String(r.cfop||''),
      cst:e.cst,descCst:e.descCst,cc:e.cc,redIbs:e.redIbs,redCbs:e.redCbs,semAliquota:e.zero,origem:e.origem,situacao:e.situacao,obs:e.obs,calculado:e.calcula,
      valor,icms,iss,ipi,pis,cofins,hoje:hojeT,base,anos,itens:1,documentos:1};
  }
  function projetar(itens,cr){cr=cr||cronograma();return (itens||[]).filter(Boolean).map(r=>calcular(r,cr))}

  /* soma os itens de mesmo código e mesmo enquadramento (visão por NCM/NBS) */
  const CAMPOS=['valor','icms','iss','ipi','pis','cofins','hoje','base'],CAMPOS_ANO=['cbs','ibsE','ibsM','ibscbs','icms','iss','ipi','pis','cofins','carga','diferenca'];
  function agrupar(linhas){
    const m=new Map;
    for(const l of linhas||[]){
      const k=[l.tipo,l.codigo,l.servico,l.cst,l.cc,l.redIbs,l.redCbs,l.origem,l.situacao].join('|');
      let g=m.get(k);
      if(!g){g={...l,anos:l.anos.map(a=>({...a})),itens:0,docs:new Set,operacoes:new Set};for(const f of CAMPOS)g[f]=0;for(const a of g.anos)for(const f of CAMPOS_ANO)a[f]=0;m.set(k,g)}
      g.itens++;g.docs.add(l.chave);g.operacoes.add(l.operacao);
      for(const f of CAMPOS)g[f]+=l[f];
      l.anos.forEach((a,i)=>{for(const f of CAMPOS_ANO)g.anos[i][f]+=a[f]});
    }
    return [...m.values()].map(g=>{
      for(const f of CAMPOS)g[f]=n2(g[f]);for(const a of g.anos)for(const f of CAMPOS_ANO)a[f]=n2(a[f]);
      g.documentos=g.docs.size;g.operacao=g.operacoes.size>1?'Entrada e saída':[...g.operacoes][0];g.documento='';g.emissao='';g.item='';delete g.docs;delete g.operacoes;return g});
  }
  /* totais dos itens calculados; os de alíquota própria ficam fora, para a comparação não ficar incompleta */
  function totalizar(linhas){
    const T={itens:0,codigos:0,fora:{itens:0,valor:0},anos:ANOS.map(ano=>({ano}))},cods=new Set;
    for(const f of CAMPOS)T[f]=0;for(const a of T.anos)for(const f of CAMPOS_ANO)a[f]=0;
    for(const l of linhas||[]){
      if(!l.calculado){T.fora.itens+=l.itens;T.fora.valor+=l.valor;continue}
      T.itens+=l.itens;if(l.codigo)cods.add(l.tipo+l.codigo);
      for(const f of CAMPOS)T[f]+=l[f];
      l.anos.forEach((a,i)=>{for(const f of CAMPOS_ANO)T.anos[i][f]+=a[f]});
    }
    for(const f of CAMPOS)T[f]=n2(T[f]);for(const a of T.anos)for(const f of CAMPOS_ANO)a[f]=n2(a[f]);
    T.fora.valor=n2(T.fora.valor);T.codigos=cods.size;
    return T;
  }

  /* ---------- textos de apoio ---------- */
  function explicacao(cr){
    cr=cr||cronograma();
    const trans=ANOS.map((a,i)=>cr.redAnt[i]>0&&cr.redAnt[i]<100?a+' ('+pct(cr.redAnt[i])+')':'').filter(Boolean);
    const fim=ANOS[cr.redAnt.findIndex(x=>x>=100)]||2033;
    const passos=[
      ['Tributos de hoje','ICMS, ISS, IPI, PIS e COFINS destacados em cada item dos documentos carregados. Nenhum valor do documento é recalculado.'],
      ['Base de IBS e CBS','Valor do item − ICMS − ISS − PIS − COFINS. Nas notas de serviço, o ISS ocupa o lugar do ICMS. A mesma base é usada de 2026 a 2033.'],
      ['IBS e CBS de cada ano','Base × alíquota do ano no cronograma (CBS, IBS estadual e IBS municipal), com a redução do cClassTrib do item.'],
      ['PIS e COFINS','Extintos em 2027: aparecem somente em 2026.'],
      ['IPI','Alíquota zero a partir de 2027, exceto para produtos com industrialização incentivada na Zona Franca de Manaus.'],
      ['ICMS e ISS','Integrais até '+(ANOS[cr.redAnt.findIndex(x=>x>0)]-1||2028)+', reduzidos em '+(trans.join(', ')||'—')+' e extintos em '+fim+'.'],
      ['2026','Ano de teste: o IBS ('+pct(cr.ibsE[0]+cr.ibsM[0])+') e a CBS ('+pct(cr.cbs[0])+') são compensados com PIS e COFINS, por isso não somam à carga do ano.'],
      ['Carga do ano','IBS + CBS do ano mais o que ainda resta de ICMS, ISS, IPI, PIS e COFINS. A diferença compara essa carga com os tributos de hoje.']];
    const avisos=[
      'É uma projeção sobre os valores dos documentos carregados. Não desconta os créditos de IBS e CBS das compras e não é apuração nem valor a recolher.',
      'CST e cClassTrib vêm do documento quando ele informa um código válido; senão, da relação de NCM (TIPI) ou de NBS e serviços. A coluna Origem do enquadramento mostra qual foi usado.',
      'Itens em CONFERIR trazem o motivo na coluna Observação. Quando há mais de uma hipótese de enquadramento, o cálculo é feito sem redução.',
      'Os totais somam entradas e saídas. Use o filtro Operação para ver só as saídas (débitos) ou só as entradas (compras).',
      'Notas de serviço não trazem PIS e COFINS destacados; nesses itens a base desconta somente o ISS.',
      'CT-e fica fora do cálculo: o valor do frete e o ICMS do transporte não são lidos por item.',
      'ICMS-ST, DIFAL, frete, seguro, descontos e Imposto Seletivo não entram nesta projeção.'];
    return {passos,avisos};
  }

  /* ---------- tela ---------- */
  let linhas=[],visiveis=[],pagina=0,assinatura='',crono=cronograma();
  const filtro=id=>($(id)?$(id).value:'');
  function filtrar(){
    const busca=filtro('v277Busca').trim().toLowerCase(),bd=dig(busca),op=filtro('v277Operacao'),tp=filtro('v277Tipo'),sit=filtro('v277Situacao'),ord=filtro('v277Ordem');
    let l=linhas.filter(x=>(!op||x.operacao===op)&&(!sit||x.situacao===sit)&&(!tp||(tp==='NCM'?x.tipo==='NCM':tp==='SERV'?(x.tipo==='NBS'||x.tipo==='SERVIÇO'):!x.tipo))
      &&(!busca||(x.rotulo+' '+x.descricao+' '+x.documento+' '+x.cc+' '+x.cst+' '+x.servico+' '+x.origem).toLowerCase().includes(busca)||(bd.length>=2&&x.codigo.includes(bd))));
    if(filtro('v277Visao')==='codigo')l=agrupar(l);
    const dif=x=>x.calculado?x.anos[7].diferenca:null;
    if(ord==='aumento')l=[...l].sort((a,b)=>(dif(b)??-Infinity)-(dif(a)??-Infinity));
    else if(ord==='reducao')l=[...l].sort((a,b)=>(dif(a)??Infinity)-(dif(b)??Infinity));
    else if(ord==='valor')l=[...l].sort((a,b)=>b.valor-a.valor);
    return l;
  }
  const reducaoTxt=l=>!l.calculado?'—':l.semAliquota?'Sem alíquota':l.redIbs===l.redCbs?(l.redIbs>0?pct(l.redIbs):'Sem redução'):'IBS '+pct(l.redIbs)+' · CBS '+pct(l.redCbs);
  const sinal=v=>v>0?'v253-neg':v<0?'v253-pos':'';
  function cabecalho(agr){
    const id=agr?['Código','Itens','Documentos','Operação']:['Documento','Emissão','Operação','Item','Código'];
    return '<tr class="excel-header">'+id.map(t=>'<th>'+t+'</th>').join('')+'<th>Descrição</th><th class="v277-h-enq">CST</th><th class="v277-h-enq">Descrição do CST</th><th class="v277-h-enq">cClassTrib</th><th class="v277-h-enq">Redução IBS/CBS</th><th class="v277-h-enq">Origem do enquadramento</th>'
      +'<th class="v277-h-hoje">Valor do item</th><th class="v277-h-hoje">ICMS hoje</th><th class="v277-h-hoje">ISS hoje</th><th class="v277-h-hoje">IPI hoje</th><th class="v277-h-hoje">PIS hoje</th><th class="v277-h-hoje">COFINS hoje</th><th class="v277-h-hoje">Tributos hoje</th>'
      +'<th class="v277-h-base">Base IBS/CBS</th>'+ANOS.map((a,i)=>'<th class="v277-h-ano">IBS+CBS '+a+(i?'':' (teste)')+'</th>').join('')
      +'<th class="v277-h-ano">Carga em 2033</th><th class="v277-h-ano">Diferença 2033 × hoje</th><th>Situação</th><th>Observação</th></tr>';
  }
  function linhaHtml(l,i,agr){
    const n=v=>'<td class="v277-n">'+real(v)+'</td>',t=v=>'<td>'+esc(v)+'</td>',c=l.calculado,u=l.anos[7];
    const id=agr?'<td><b>'+esc(l.rotulo)+'</b></td><td class="v277-n">'+inteiro(l.itens)+'</td><td class="v277-n">'+inteiro(l.documentos)+'</td>'+t(l.operacao)
      :t(l.documento)+t(l.emissao)+t(l.operacao)+t(l.item)+'<td><b>'+esc(l.rotulo)+'</b></td>';
    return '<tr class="v277-linha" data-v277-i="'+i+'">'+id+'<td title="'+esc(l.descricao)+'">'+esc(l.descricao)+'</td>'+t(l.cst)+'<td title="'+esc(l.descCst)+'">'+esc(l.descCst)+'</td>'+t(l.cc)+t(reducaoTxt(l))+t(l.origem)
      +n(l.valor)+n(l.icms)+n(l.iss)+n(l.ipi)+n(l.pis)+n(l.cofins)+'<td class="v277-n"><b>'+real(l.hoje)+'</b></td><td class="v277-n"><b>'+real(l.base)+'</b></td>'
      +l.anos.map(a=>n(c?a.ibscbs:null)).join('')+'<td class="v277-n"><b>'+real(c?u.carga:null)+'</b></td><td class="v277-n '+(c?sinal(u.diferenca):'')+'"><b>'+real(c?u.diferenca:null)+'</b></td>'
      +'<td><span class="v253-semaforo '+CLS[l.situacao]+'" title="'+esc(LEITURA[l.situacao])+'">'+l.situacao+'</span></td><td class="v277-obs" title="'+esc(l.obs)+'">'+esc(l.obs)+'</td></tr>';
  }
  function detalheHtml(l,agr){
    const c=l.calculado;
    const corpo=l.anos.map(a=>'<tr><td><b>'+a.ano+'</b></td><td>'+(c?pct(a.aliqCbs):'—')+'</td><td>'+real(c?a.cbs:null)+'</td><td>'+(c?pct(a.aliqIbsE):'—')+'</td><td>'+real(c?a.ibsE:null)+'</td><td>'+(c?pct(a.aliqIbsM):'—')+'</td><td>'+real(c?a.ibsM:null)+'</td><td><b>'+real(c?a.ibscbs:null)+'</b></td>'
      +'<td>'+real(a.icms)+'</td><td>'+real(a.iss)+'</td><td>'+real(a.ipi)+'</td><td>'+real(n2(a.pis+a.cofins))+'</td><td><b>'+real(c?a.carga:null)+'</b></td><td class="'+(c?sinal(a.diferenca):'')+'"><b>'+real(c?a.diferenca:null)+'</b></td></tr>').join('');
    return '<div class="v277-det"><b>'+esc(agr?l.rotulo+' — '+inteiro(l.itens)+' item(ns) em '+inteiro(l.documentos)+' documento(s)':'Item '+(l.item||'—')+' do documento '+(l.documento||'—')+' — '+l.rotulo)+'</b>'
      +'<p><b>Base de IBS e CBS</b> = valor do item '+real(l.valor)+' − ICMS '+real(l.icms)+' − ISS '+real(l.iss)+' − PIS '+real(l.pis)+' − COFINS '+real(l.cofins)+' = <b>'+real(l.base)+'</b></p>'
      +'<p><b>Enquadramento:</b> CST '+esc(l.cst)+(l.descCst?' — '+esc(l.descCst):'')+' · cClassTrib '+esc(l.cc)+' · '+esc(reducaoTxt(l)).toLowerCase()+' · origem: '+esc(l.origem)+'</p>'
      +(l.obs?'<p><b>Observação:</b> '+esc(l.obs)+'</p>':'')
      +'<table class="v277-ano"><thead><tr><th>Ano</th><th>Alíq. CBS</th><th>CBS</th><th>Alíq. IBS estadual</th><th>IBS estadual</th><th>Alíq. IBS municipal</th><th>IBS municipal</th><th>IBS + CBS</th><th>ICMS</th><th>ISS</th><th>IPI</th><th>PIS + COFINS</th><th>Carga do ano</th><th>Diferença contra hoje</th></tr></thead><tbody>'+corpo+'</tbody></table>'
      +'<p class="v277-nota">Tributos de hoje neste item: '+real(l.hoje)+'. Em 2026, o IBS e a CBS de teste não somam à carga do ano.</p></div>';
  }
  function kpisHtml(T){
    const k=(rot,val,sub,cls)=>'<div class="v260-kpi'+(cls?' '+cls:'')+'"><label>'+rot+'</label><b>'+val+'</b><small>'+sub+'</small></div>',a27=T.anos[1],a33=T.anos[7],d=a33.diferenca;
    return k('Itens no cálculo',inteiro(T.itens),inteiro(T.codigos)+' código(s) NCM/NBS')
      +k('Valor dos itens',real(T.valor),'itens selecionados pelos filtros')
      +k('Tributos de hoje',real(T.hoje),'ICMS '+real(T.icms)+' · ISS '+real(T.iss)+' · IPI '+real(T.ipi)+' · PIS '+real(T.pis)+' · COFINS '+real(T.cofins))
      +k('Base de IBS e CBS',real(T.base),'valor − ICMS − ISS − PIS − COFINS')
      +k('IBS + CBS em 2027',real(a27.ibscbs),'CBS '+real(a27.cbs)+' · IBS '+real(n2(a27.ibsE+a27.ibsM)))
      +k('IBS + CBS em 2033',real(a33.ibscbs),'CBS '+real(a33.cbs)+' · IBS '+real(n2(a33.ibsE+a33.ibsM)))
      +k('Carga em 2033 × hoje',real(d),(T.hoje?pct(Math.abs(d)/T.hoje*100)+' ':'')+(d>0?'a mais que hoje':d<0?'a menos que hoje':'sem diferença'),d>0?'alerta':'ok');
  }
  function resumoLinhas(T){
    return T.anos.map((a,i)=>({ano:a.ano,pisCofins:n2(a.pis+a.cofins),ipi:a.ipi,icmsIss:n2(a.icms+a.iss),cbs:a.cbs,ibsE:a.ibsE,ibsM:a.ibsM,ibscbs:a.ibscbs,carga:a.carga,diferenca:a.diferenca,
      variacao:T.hoje?a.diferenca/T.hoje*100:null,fase:fase(i,crono)}));
  }
  function resumoHtml(T){
    return '<table id="v277ResumoTabela"><thead><tr class="excel-header"><th>Ano</th><th>PIS + COFINS</th><th>IPI</th><th>ICMS + ISS</th><th>CBS</th><th>IBS estadual</th><th>IBS municipal</th><th>IBS + CBS</th><th>Carga do ano</th><th>Diferença contra hoje</th><th>Variação</th><th>Fase</th></tr></thead><tbody>'
      +resumoLinhas(T).map(x=>'<tr><td><b>'+x.ano+'</b></td><td class="v277-n">'+real(x.pisCofins)+'</td><td class="v277-n">'+real(x.ipi)+'</td><td class="v277-n">'+real(x.icmsIss)+'</td><td class="v277-n">'+real(x.cbs)+'</td><td class="v277-n">'+real(x.ibsE)+'</td><td class="v277-n">'+real(x.ibsM)+'</td><td class="v277-n"><b>'+real(x.ibscbs)+'</b></td><td class="v277-n"><b>'+real(x.carga)+'</b></td>'
        +'<td class="v277-n '+sinal(x.diferenca)+'"><b>'+real(x.diferenca)+'</b></td><td class="v277-n '+sinal(x.diferenca)+'">'+(x.variacao===null?'—':pct(x.variacao))+'</td><td class="v277-fase">'+esc(x.fase)+'</td></tr>').join('')+'</tbody></table>';
  }
  function comoHtml(){
    const e=explicacao(crono);
    return '<div class="v277-como"><div><b>Como o cálculo é feito</b><dl>'+e.passos.map(p=>'<dt>'+esc(p[0])+'</dt><dd>'+esc(p[1])+'</dd>').join('')+'</dl></div>'
      +'<div class="v277-avisos"><b>Atenção ao interpretar</b><ul>'+e.avisos.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div></div>';
  }
  function titulo(){
    const t=$('v123-title'),sec=$('calculo2033');if(!t||!sec||!sec.classList.contains('active'))return;
    const s=(typeof state!=='undefined'&&state)||{};
    t.textContent='Cálculo 2026 a 2033 por item — Documentos: '+inteiro((s.docs||[]).length)+' · itens: '+inteiro(itensCarga().length)+' · todos os itens dos XMLs, em páginas.';
  }
  function render(recalcular){
    const sec=$('calculo2033');if(!sec)return;
    const itens=itensCarga(),ass=itens.length+'|'+((typeof state!=='undefined'&&state&&state.runId)||0);
    if(recalcular||ass!==assinatura){crono=cronograma();linhas=projetar(itens,crono);assinatura=ass;pagina=0}
    const vazio=!itens.length,agr=filtro('v277Visao')==='codigo';
    visiveis=vazio?[]:filtrar();
    const T=totalizar(visiveis),paginas=Math.max(1,Math.ceil(visiveis.length/PAGINA));pagina=Math.min(Math.max(0,pagina),paginas-1);
    const ini=pagina*PAGINA,pag=visiveis.slice(ini,ini+PAGINA);
    $('v277Kpis').hidden=vazio;$('v277ResumoCard').hidden=vazio;
    $('v277Kpis').innerHTML=vazio?'':kpisHtml(T);
    $('v277Resumo').innerHTML=vazio?'':resumoHtml(T);
    $('v277Fora').textContent=T.fora.itens?inteiro(T.fora.itens)+' item(ns), '+real(T.fora.valor)+', não foram calculados (situação NÃO CALCULADO; o motivo está na coluna Observação) e ficaram fora destes totais.':'';
    $('v277Como').innerHTML=comoHtml();
    const tb=$('v277Tabela');
    tb.querySelector('thead').innerHTML=cabecalho(agr);
    tb.querySelector('tbody').innerHTML=vazio?'<tr><td class="empty" colspan="40">Processe arquivos para ver o cálculo de 2026 a 2033 por item.</td></tr>'
      :pag.map((l,i)=>linhaHtml(l,ini+i,agr)).join('')||'<tr><td class="empty" colspan="40">Nenhum item para os filtros selecionados.</td></tr>';
    $('v277Info').textContent=vazio?'Nenhum documento processado.':(agr?'Códigos: ':'Itens: ')+inteiro(visiveis.length)+(visiveis.length?' · exibindo '+inteiro(ini+1)+' a '+inteiro(ini+pag.length):'')+(agr?' · itens somados: '+inteiro(visiveis.reduce((a,x)=>a+x.itens,0)):linhas.length!==visiveis.length?' · de '+inteiro(linhas.length)+' na carga':'')+'. Clique em uma linha para ver o cálculo ano a ano.';
    $('v277Pag').innerHTML=paginas>1?'<button type="button" class="secondary" data-v277-pag="-1"'+(pagina?'':' disabled')+'>‹ Anterior</button><span>Página '+inteiro(pagina+1)+' de '+inteiro(paginas)+'</span><button type="button" class="secondary" data-v277-pag="1"'+(pagina<paginas-1?'':' disabled')+'>Próxima ›</button>':'';
    const c=document.querySelector('[data-v123-count="calculoitem"]');if(c)c.textContent=String(itens.length);
    titulo();
  }

  /* ---------- exportação ---------- */
  function linhasExport(lista,agr){
    const v=x=>x===null||x===undefined?'':fmt(x);
    return lista.map(l=>{
      const c=l.calculado,o=agr?{'Código':l.rotulo,'Itens':l.itens,'Documentos':l.documentos,'Operação':l.operacao}
        :{'Documento':l.documento,'Emissão':l.emissao,'Operação':l.operacao,'Item':l.item,'Emitente':l.emitente,'Destinatário':l.destinatario,'Código':l.rotulo};
      Object.assign(o,{'Código do serviço':l.servico,'Descrição':l.descricao,'CFOP':agr?'':l.cfop,'CST':l.cst,'Descrição do CST':l.descCst,'cClassTrib':l.cc,
        'Redução IBS (%)':c&&!l.semAliquota?v(l.redIbs):'','Redução CBS (%)':c&&!l.semAliquota?v(l.redCbs):'','Origem do enquadramento':l.origem,'Situação':l.situacao,'Observação':l.obs,
        'Valor do item':v(l.valor),'ICMS hoje':v(l.icms),'ISS hoje':v(l.iss),'IPI hoje':v(l.ipi),'PIS hoje':v(l.pis),'COFINS hoje':v(l.cofins),'Tributos hoje':v(l.hoje),'Base IBS/CBS':v(l.base)});
      for(const a of l.anos){o['CBS '+a.ano]=v(c?a.cbs:null);o['IBS estadual '+a.ano]=v(c?a.ibsE:null);o['IBS municipal '+a.ano]=v(c?a.ibsM:null);o['IBS+CBS '+a.ano]=v(c?a.ibscbs:null);
        o['ICMS+ISS '+a.ano]=v(n2(a.icms+a.iss));o['Carga '+a.ano]=v(c?a.carga:null)}
      o['Diferença 2033 × hoje']=v(c?l.anos[7].diferenca:null);
      return o});
  }
  function exportar(){
    if(!visiveis.length)return alert('Não há itens para exportar.');
    const agr=filtro('v277Visao')==='codigo',T=totalizar(visiveis),e=explicacao(crono),v=x=>fmt(x);
    const resumo=resumoLinhas(T).map(x=>({'Ano':String(x.ano),'PIS + COFINS':v(x.pisCofins),'IPI':v(x.ipi),'ICMS + ISS':v(x.icmsIss),'CBS':v(x.cbs),'IBS estadual':v(x.ibsE),'IBS municipal':v(x.ibsM),'IBS + CBS':v(x.ibscbs),
      'Carga do ano':v(x.carga),'Diferença contra hoje':v(x.diferenca),'Variação':x.variacao===null?'':pct(x.variacao),'Fase':x.fase}));
    const cron=ANOS.map((a,i)=>({'Ano':String(a),'CBS':pct(crono.cbs[i]),'IBS estadual':pct(crono.ibsE[i]),'IBS municipal':pct(crono.ibsM[i]),'Redução do ICMS e do ISS':pct(crono.redAnt[i])}));
    const como=e.passos.map(p=>({assunto:p[0],explicacao:p[1]})).concat(e.avisos.map(x=>({assunto:'Atenção ao interpretar',explicacao:x})));
    if(typeof gerarXlsx==='function')gerarXlsx('CALCULO_2026_2033_POR_ITEM_'+new Date().toISOString().slice(0,10)+'.xlsx',
      [[agr?'Cálculo por código':'Cálculo por item',linhasExport(visiveis,agr)],['Resumo por ano',resumo],['Cronograma usado',cron],['Como é calculado',como]]);
  }

  /* ---------- montagem da tela e do menu ---------- */
  function criar(){
    if($('calculo2033'))return;
    const ref=document.querySelector('.tab[data-tab="icms"]'),sec=$('icms');if(!ref||!sec)return;
    ref.insertAdjacentHTML('beforebegin','<button class="tab" data-tab="calculo2033">Cálculo 2026–2033</button>');
    const op=(v,t)=>'<option value="'+v+'">'+t+'</option>';
    sec.insertAdjacentHTML('beforebegin','<section id="calculo2033" class="panel">'
      +'<div class="card"><div class="actions"><b class="v277-t" style="font-size:17px">Cálculo 2026 a 2033 por item</b>'
      +'<span class="hint">Para cada item (NCM ou NBS): o que é tributado hoje por ICMS, ISS, IPI, PIS e COFINS e a projeção de IBS e CBS de 2026 a 2033 pelo cronograma de alíquotas, conforme o CST e o cClassTrib do item. Base de IBS e CBS = valor do item − ICMS − ISS − PIS − COFINS.</span></div>'
      +'<div class="v253-filtros"><input type="search" id="v277Busca" placeholder="Pesquisar NCM, NBS, descrição, documento ou cClassTrib">'
      +'<select id="v277Visao">'+op('item','Ver por: item do documento')+op('codigo','Ver por: código NCM/NBS (somado)')+'</select>'
      +'<select id="v277Operacao">'+op('','Operação: todas')+op('Entrada','Entradas')+op('Saída','Saídas')+'</select>'
      +'<select id="v277Tipo">'+op('','Tipo: todos')+op('NCM','Mercadorias (NCM)')+op('SERV','Serviços (NBS)')+op('SEM','Sem NCM ou NBS')+'</select>'
      +'<select id="v277Situacao">'+op('','Situação: todas')+Object.values(S).map(s=>op(s,s)).join('')+'</select>'
      +'<select id="v277Ordem">'+op('','Ordem: dos documentos')+op('aumento','Maior aumento em 2033')+op('reducao','Maior redução em 2033')+op('valor','Maior valor do item')+'</select>'
      +'<button type="button" id="v277Exportar" class="secondary">⬇ Exportar Excel</button></div>'
      +'<div id="v277Info" class="hint" style="margin-top:6px">Nenhum documento processado.</div></div>'
      +'<div id="v277Kpis" class="v277-kpis" hidden></div>'
      +'<div class="card" style="padding:0"><div class="v277-pag" id="v277Pag"></div><div class="table-wrap" id="v277Wrap"><table id="v277Tabela"><thead></thead><tbody></tbody></table></div></div>'
      +'<div class="card" id="v277ResumoCard" hidden><b class="v277-t">Resumo por ano</b><span class="hint">Soma dos itens selecionados pelos filtros acima. A carga do ano é o IBS + CBS mais o que ainda resta de ICMS, ISS, IPI, PIS e COFINS.</span><div class="table-wrap" id="v277Resumo"></div><div id="v277Fora" class="hint"></div></div>'
      +'<div class="card" id="v277Como"></div></section>');
    const st=document.createElement('style');st.id='v277-style';st.textContent=[
      '.v277-t{display:block;font-size:15px;color:#0F2A4A;margin-bottom:4px}#calculo2033 .hint{display:block}',
      '.v277-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:0 0 12px}.v277-kpis[hidden]{display:none!important}.v277-kpis .v260-kpi small{display:block;line-height:1.35}',
      '#v277Tabela{width:max-content!important;min-width:100%!important;table-layout:auto!important}#v277Tabela td,#v277Tabela th{font-size:12px}#v277Tabela thead th{min-width:0!important;padding-right:12px!important}#v277Tabela td:nth-child(6){max-width:240px}',
      '#v277Tabela td.v277-n,#v277ResumoTabela td.v277-n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}#v277Tabela th:nth-child(n+12),#v277ResumoTabela th:nth-child(n+2){text-align:right!important}#v277Tabela th:nth-last-child(-n+2),#v277ResumoTabela th:last-child{text-align:left!important}',
      '#v277Tabela th.v277-h-enq{box-shadow:inset 0 3px 0 #8D8D8D}#v277Tabela th.v277-h-hoje{box-shadow:inset 0 3px 0 #0F2A4A}#v277Tabela th.v277-h-base{box-shadow:inset 0 3px 0 #2456C8}#v277Tabela th.v277-h-ano{box-shadow:inset 0 3px 0 #F26B21}',
      '#v277Tabela td.v277-obs{max-width:380px}.v277-linha{cursor:pointer}.v277-linha:hover td{background:#F4F8FB}.v277-linha.aberta td{background:#EEF4FB}',
      '.v277-pag{display:flex;gap:10px;align-items:center;justify-content:flex-end;padding:8px 12px;font-size:12px;color:#33475B}.v277-pag:empty{display:none}.v277-pag button{padding:5px 10px}',
      '.v277-det-tr>td{max-width:none!important;overflow:visible!important;white-space:normal!important;background:#F7FAFC!important;padding:0!important}',
      '.v277-det{position:sticky;left:0;box-sizing:border-box;width:min(1240px,calc(100vw - 150px));padding:14px 16px;font-size:12px;line-height:1.5;color:#33475B}.v277-det>b{display:block;margin-bottom:6px;font-size:13px;color:#123D60}.v277-det p{margin:0 0 5px}',
      '.v277-ano{width:100%!important;min-width:0!important;table-layout:auto!important;border-collapse:collapse!important;margin:8px 0 6px;background:#fff}.v277-ano th,.v277-ano td{border:1px solid #D8E2EA!important;padding:5px 7px!important;text-align:right;font-size:11.5px;white-space:nowrap;position:static!important}.v277-ano th:first-child,.v277-ano td:first-child{text-align:left}.v277-ano th{white-space:normal}',
      '.v277-nota{font-size:11px;color:#54636F}td.v277-fase{white-space:normal!important;color:#54636F}',
      '#v277ResumoCard .table-wrap{height:auto!important;min-height:0!important;max-height:none!important;margin-top:8px}#v277ResumoTabela{table-layout:auto!important;min-width:0!important;width:100%!important}#v277ResumoTabela th,#v277ResumoTabela td{padding-left:8px!important;padding-right:8px!important;min-width:0!important;width:auto!important;font-size:12px}#v277ResumoTabela th{white-space:normal!important}',
      '.v277-como{display:grid;grid-template-columns:1.4fr 1fr;gap:14px;font-size:12px;line-height:1.5;color:#33475B}.v277-como>div{border:1px solid #C6C6C6;padding:12px 14px;background:#fff}.v277-como b{color:#123D60}',
      '.v277-como dl{margin:6px 0 0;display:grid;grid-template-columns:minmax(130px,auto) 1fr;gap:5px 12px}.v277-como dt{font-weight:700;color:#182936}.v277-como dd{margin:0}.v277-avisos{border-left:4px solid #F1C21B!important}.v277-avisos ul{margin:6px 0 0;padding-left:18px}.v277-avisos li{margin:5px 0}',
      '@media(max-width:1100px){.v277-como{grid-template-columns:1fr}}@media print{.v277-pag,#calculo2033 .v253-filtros{display:none!important}}'
    ].join('');document.head.appendChild(st);
    const tab=document.querySelector('.tab[data-tab="calculo2033"]');
    tab.onclick=()=>{document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('active'));tab.classList.add('active');$('calculo2033').classList.add('active');render(true);setTimeout(titulo,0)};
    const side=$('v123-sidebar');
    if(side){
      const b=document.createElement('button');b.className='v123-link';b.dataset.v123Tab='calculo2033';b.dataset.v123Key='calculoitem';
      b.innerHTML='Cálculo 2026 a 2033 por item<small data-v123-count="calculoitem">0</small>';
      const r=side.querySelector('[data-v123-key="ibs"]');if(r)r.after(b);else side.appendChild(b);
    }
    for(const id of ['v277Busca','v277Visao','v277Operacao','v277Tipo','v277Situacao','v277Ordem'])$(id).addEventListener('input',()=>{pagina=0;render(false)});
    $('v277Exportar').onclick=exportar;
    $('v277Pag').addEventListener('click',ev=>{const b=ev.target.closest('[data-v277-pag]');if(!b||b.disabled)return;pagina+=Number(b.dataset.v277Pag);render(false);const w=$('v277Wrap');if(w)w.scrollTop=0});
    $('v277Tabela').addEventListener('click',ev=>{
      const tr=ev.target.closest('tr.v277-linha');if(!tr)return;
      const aberto=tr.classList.contains('aberta');
      $('v277Tabela').querySelectorAll('.v277-det-tr').forEach(x=>x.remove());$('v277Tabela').querySelectorAll('.v277-linha.aberta').forEach(x=>x.classList.remove('aberta'));
      const l=visiveis[Number(tr.dataset.v277I)];if(aberto||!l)return;
      const d=document.createElement('tr');d.className='v277-det-tr';d.innerHTML='<td colspan="'+tr.cells.length+'">'+detalheHtml(l,filtro('v277Visao')==='codigo')+'</td>';
      tr.classList.add('aberta');tr.after(d);
      const lw=$('v277Wrap').clientWidth;if(lw>300)d.querySelector('.v277-det').style.width=(lw-4)+'px';
    });
  }
  criar();
  const anterior=window.renderAba;
  if(typeof anterior==='function')window.renderAba=function(id){if(id==='calculo2033'){render(true);return}return anterior(id)};
  /* contador do menu e tela aberta acompanham a carga */
  setInterval(()=>{
    const n=itensCarga().length,c=document.querySelector('[data-v123-count="calculoitem"]');if(c&&c.textContent!==String(n))c.textContent=String(n);
    const sec=$('calculo2033');if(sec&&sec.classList.contains('active')&&n+'|'+((typeof state!=='undefined'&&state&&state.runId)||0)!==assinatura)render(true);
  },2000);
  window.classificadorV277={calcular,projetar,agrupar,totalizar,cronograma,explicacao,render,exportar,linhasExport,ANOS,SITUACAO:S};
  window.V277_CARREGADO=true;
})();
