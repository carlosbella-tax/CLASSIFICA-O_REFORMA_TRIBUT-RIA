/* V278 — Excel e PDF em todas as telas do menu.
   Coloca os botões "Exportar Excel" e "Imprimir / PDF" nas telas que não tinham um deles:
   Carregar XML/PDF, SPED Fiscal, EFD Contribuições, NF-e, CT-e, NFS-e, Cálculo 2026 a 2033 por item,
   Análise por NCM, Fornecedores e clientes, Validação de atividades (CNAE), cronograma de alíquotas e
   resultado da Consulta NCM e NBS. Na Base de IBS/CBS, os dois botões passam a trazer todas as linhas.
   O PDF sai em folha própria (A4 paisagem): cabeçalho com a empresa informada na primeira tela e as
   mesmas planilhas do Excel, com TODAS as linhas. Tabela com muitas colunas é dividida em partes, cada
   uma repetindo as colunas que identificam a linha, para o texto continuar legível.
   Somente leitura: não altera itens, impostos, filtros nem o enquadramento. */
(function(){
  if (window.V278_CARREGADO) return;
  const $id=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const txt=n=>n?String(n.textContent||'').replace(/\s+/g,' ').trim():'';
  const MAX_COLUNAS=12,LIMITE_CELULAS=600000;
  const S=()=>typeof state!=='undefined'&&state?state:{items:[],docs:[],errors:[]};
  const filtradas=(rows,id)=>typeof filtrarLinhas==='function'?filtrarLinhas(rows||[],id):(rows||[]);
  const mostra=(c,v)=>typeof displayValue==='function'?displayValue(c,v):(v===null||v===undefined?'':String(v));
  const numero=v=>typeof num==='function'?num(v):(Number(String(v??'').replace(',','.'))||0);
  const vazio=v=>v===''||v===null||v===undefined;
  const inteiro=v=>new Intl.NumberFormat('pt-BR').format(v);
  /* cópia simples da linha: sem campos internos nem objetos (ex.: dados_nfse) */
  const plana=r=>{const o={};for(const k of Object.keys(r||{})){const v=r[k];if(k.startsWith('__')||(v&&typeof v==='object'))continue;o[k]=v}return o};
  const colunasDe=linhas=>{const s=new Set;for(const r of linhas)for(const k of Object.keys(r))s.add(k);return [...s]};
  const sec=(titulo,linhas,o={})=>({titulo,linhas:linhas||[],chaves:o.chaves||[],pronto:!!o.pronto,nota:o.nota||''});
  const dePlanilhas=(planilhas,chaves)=>(planilhas||[]).map((p,i)=>sec(p[0],p[1],{pronto:true,chaves:i?[]:chaves}));

  /* ---------- o que cada tela exporta: as mesmas planilhas no Excel e no PDF ---------- */
  function porDocumento(itens){
    const m=new Map;
    for(const r of itens){
      const k=String(r.chave_documento||'')+'|'+String(r.numero_documento||'')+'|'+String(r.arquivo_origem||'');
      let d=m.get(k);
      if(!d){d={arquivo_origem:r.arquivo_origem||'',tipo_documento:r.tipo_documento||'',numero_documento:r.numero_documento||'',serie:r.serie||'',modelo:r.modelo||'',data_emissao:r.data_emissao||'',
        emitente_cnpj_cpf:r.emitente_cnpj_cpf||'',emitente_razao_social:r.emitente_razao_social||'',destinatario_cnpj_cpf:r.destinatario_cnpj_cpf||'',destinatario_razao_social:r.destinatario_razao_social||'',itens:0,valor_itens:0};m.set(k,d)}
      d.itens++;d.valor_itens+=numero(r.valor_item);
    }
    return [...m.values()].map(d=>Object.assign(d,{valor_itens:Math.round(d.valor_itens*100)/100}));
  }
  const itensTela=()=>filtradas(typeof linhasItensComIcms==='function'?linhasItensComIcms():S().items,'table').map(plana);
  const CH_ITEM=['numero_documento','numero_item','codigo_item'];
  const NOTA_FILTRO='Linhas exibidas na tela, com os filtros ativos.';
  const sped=(k,padrao)=>({titulo:padrao.curto,arquivo:k,secoes(){
    const T=(window.classificadorV261&&window.classificadorV261.TIPOS||{})[k]||padrao;
    const itens=(S().items||[]).filter(r=>T.re.test(String(r.tipo_documento||'')));
    return [sec('Documentos da escrituração',porDocumento(itens),{chaves:['numero_documento']}),sec('Itens da escrituração',itens.map(plana),{chaves:CH_ITEM})]}});
  const textos=(raiz,seletor)=>[...(raiz?raiz.querySelectorAll(seletor):[])].map(txt).filter(Boolean);
  const TELAS={
    documentos:{titulo:'Documentos carregados',arquivo:'documentos_carregados',secoes(){const s=S();
      return [sec('Documentos carregados',filtradas(s.docs,'loaded').map(plana),{chaves:['numero_documento']}),sec('Erros e não reconhecidos',(s.errors||[]).map(plana))]}},
    spedfiscal:sped('spedfiscal',{curto:'SPED Fiscal',re:/SPED EFD ICMS/i}),
    efdcontrib:sped('efdcontrib',{curto:'EFD Contribuições',re:/SPED EFD Contribui/i}),
    /* NF-e e CT-e abrem a mesma lista de itens, com todos os tipos de documento; a coluna tipo_de_documento separa */
    itens:{titulo:'Itens dos documentos carregados',arquivo:'itens_documentos',secoes:()=>[sec('Itens dos documentos',itensTela(),{chaves:CH_ITEM,nota:NOTA_FILTRO+' A lista traz todos os tipos de documento; veja a coluna tipo_de_documento.'})]},
    nfse:{titulo:'NFS-e — Notas de serviço',arquivo:'nfse',secoes:()=>[sec('NFS-e — Notas de serviço',filtradas(typeof window.linhasIss==='function'?window.linhasIss():[],'iss').map(plana),
      {chaves:['numero_nota','nome_emitente'],nota:NOTA_FILTRO})]},
    /* Base de IBS/CBS: a exportação antiga procurava a tabela por outro nome e saía sem as linhas; a impressão antiga parava em 200 linhas */
    ibs:{titulo:'Base de IBS/CBS',arquivo:'base_ibs_cbs',secoes(){
      const L={tipo_documento:'Documento',codigo_item:'Código do item/serviço',descricao_item:'Descrição',codigo_referencia:'NCM / NBS',fonte:'Base de validação',validacao_referencia:'Validação NCM/NBS',
        cst_adequada:'CST adequada',cclasstrib_adequada:'cClassTrib adequada',reducao_adequada:'Redução adequada',anexo_lc214:'Anexo / enquadramento'};
      if(typeof cacheTabelas==='undefined')return [];
      if(!cacheTabelas.ibscbs&&typeof renderAba==='function')try{renderAba('ibscbs')}catch(e){}
      const linhas=filtradas((cacheTabelas.ibscbs||{}).rows,'ibscbs').map(r=>{const o={};for(const c in L)o[L[c]]=r[c]??'';return o});
      return [sec('Base de IBS/CBS',linhas,{pronto:true,chaves:['Código do item/serviço'],nota:NOTA_FILTRO})]}},
    calculoitem:{titulo:'Cálculo 2026 a 2033 por item',arquivo:'calculo_2026_2033_por_item',
      secoes:()=>dePlanilhas(window.classificadorV277&&window.classificadorV277.planilhas?window.classificadorV277.planilhas():[],['Documento','Item','Código'])},
    ncmanalise:{titulo:'Análise por NCM/NBS — efeitos da Reforma',arquivo:'analise_ncm',secoes(){
      const l=dePlanilhas(window.v253Planilhas?window.v253Planilhas.ncm():[],['chave']);if(l.length)l[0].nota=txt($id('v253Rad'));return l}},
    fornecedores:{titulo:'Fornecedores e clientes',arquivo:'fornecedores_clientes',secoes(){
      const P=window.v253Planilhas,C=window.classificadorV270,l=dePlanilhas(P?P.fornecedores():[],['cnpj','nome_documento']);
      if(l.length&&C&&C.analisar&&C.linhasExcel){const f=typeof window.v253FormatarExport==='function'?window.v253FormatarExport:x=>x;
        let c=[];try{c=f(C.linhasExcel(C.analisar(P.linhasFornecedores())))}catch(e){c=[]}
        if(c.length)l.push(sec('Crédito por fornecedor',c,{pronto:true,chaves:[colunasDe(c)[0]]}))}
      return l}},
    crono:{titulo:'Cronograma de alíquotas por tributo',arquivo:'cronograma_aliquotas',secoes(){
      const v=$id('v124-metodologia'),tb=v&&v.querySelector('table');if(!tb)return [];
      const anos=[...tb.querySelectorAll('thead th')].slice(1).map(txt);
      const linhas=[...tb.querySelectorAll('tbody tr')].map(tr=>{const o={Tributo:txt(tr.querySelector('th'))};
        [...tr.querySelectorAll('td')].forEach((td,i)=>{const inp=td.querySelector('input');o['Alíquota '+(anos[i]||i+1)]=(inp?inp.value:txt(td).replace('%',''))+'%'});return o});
      const info=textos(v,'.v168-parametros h3,.v168-parametros p,.v168-parametros div,.v168-parametros small,.v168-fontes h3,.v168-fontes p').map(t=>({'Informação':t}));
      return [sec('Alíquotas por ano',linhas,{pronto:true}),sec('Parâmetros e aplicação',info,{pronto:true})]}},
    cnae:{titulo:'Validação de atividades por CNAE',arquivo:'validacao_cnae',secoes(){
      const p=$id('v156-cnae-panel');if(!p)return [];
      const linhas=[...p.querySelectorAll('.v156-cnae-card')].map(c=>{
        const t=txt(c.querySelector('h3')).split(' — '),o={CNAE:t[0]||'',Tipo:t.slice(1).join(' — ')},itensLista=textos(c,'li');
        for(const x of c.querySelectorAll('p')){const b=x.querySelector('b'),r=txt(b).replace(/:$/,'');if(!r)continue;
          const resto=txt(x).slice(txt(b).length).trim();o[r]=resto||itensLista.join(' · ')}
        return o});
      const resumo=textos(p,'.v156-cnae-intro,.v182-cnae-contador,.v156-cnae-source').map(t=>({'Informação':t}));
      return [sec('Validação por CNAE',linhas,{pronto:true}),sec('Resumo e fontes',resumo,{pronto:true})]}},
    consulta:{titulo:'Consulta NCM e NBS',arquivo:'consulta_ncm_nbs',secoes(){
      const r=$id('v153-result');if(!r)return [];
      const resumo=[];const par=(c,v)=>{if(c&&v)resumo.push({Campo:c,Valor:v})};
      par('Consulta',txt(r.querySelector('.v153-head h2')));par('Código',txt(r.querySelector('.v194-ficha h3')));par('Situação',txt(r.querySelector('.v162-status')));
      for(const d of r.querySelectorAll('.v162-resumo>div'))par(txt(d.querySelector('span')),txt(d.querySelector('b')));
      const cand=[...r.querySelectorAll('.v162-candidato')].map(a=>{const ps=[...a.querySelectorAll(':scope>p')].map(txt),o={Enquadramento:txt(a.querySelector('h3')),'Situação':ps[0]||'','Descrição':ps[1]||''};
        for(const d of a.querySelectorAll('dl>div')){const k=txt(d.querySelector('dt'));if(k)o[k]=txt(d.querySelector('dd'))}return o});
      const calc=[];
      for(const l of r.querySelectorAll('.v162-calc label')){const i=l.querySelector('input'),c=txt(l).replace(txt(l.querySelector('small')),'').trim();if(c)calc.push({Campo:c,Valor:i?i.value:''})}
      for(const f of r.querySelectorAll('.v162-final'))calc.push({Campo:txt(f.querySelector('span')),Valor:txt(f.querySelector('strong'))});
      return [sec('Resumo da consulta',resumo,{pronto:true}),sec('Enquadramentos',cand,{pronto:true}),sec('Alíquotas e cálculo',calc,{pronto:true})]}}
  };
  /* botão → tela: a tela de carga é compartilhada por Carregar XML/PDF, SPED Fiscal e EFD Contribuições */
  function resolver(v){
    if(v==='carga'){const m=($id('load')||{dataset:{}}).dataset.v263Modo;return TELAS[m]?m:'documentos'}
    return v;
  }
  const comLinhas=t=>{const T=TELAS[t];return T?T.secoes().filter(s=>s.linhas.length):[]};
  const sufixo=()=>typeof sufixoArq==='function'?sufixoArq():new Date().toISOString().slice(0,10);

  /* ---------- Excel ---------- */
  function exportar(v){
    const t=resolver(v),T=TELAS[t],secoes=comLinhas(t);
    if(!T||!secoes.length){alert('Não há dados nesta tela para exportar.');return false}
    if(typeof gerarXlsx!=='function')return false;
    gerarXlsx(T.arquivo+'_'+sufixo()+'.xlsx',secoes.map(s=>[s.titulo,s.linhas]));
    return true;
  }

  /* ---------- PDF: folha própria ---------- */
  function blocos(s){
    const todas=colunasDe(s.linhas),usadas=todas.filter(c=>s.linhas.some(r=>!vazio(r[c]))),cols=usadas.length?usadas:todas;
    if(cols.length<=MAX_COLUNAS)return {cols,vazias:todas.length-cols.length,partes:[cols]};
    const fixas=(s.chaves||[]).filter(c=>cols.includes(c)),fix=fixas.length?fixas:cols.slice(0,1),resto=cols.filter(c=>!fix.includes(c)),n=MAX_COLUNAS-fix.length,partes=[];
    for(let i=0;i<resto.length;i+=n)partes.push(fix.concat(resto.slice(i,i+n)));
    return {cols,vazias:todas.length-cols.length,partes};
  }
  /* pontos de quebra: depois de cada _ do nome da coluna e a cada 16 caracteres de um código longo (chave de 44 dígitos, nome de arquivo) */
  const quebra=t=>esc(t).replace(/[^\s<>&;]{21,}/g,m=>m.replace(/(.{16})(?=.)/g,'$1<wbr>'));
  const cabeca=c=>esc(c).replace(/_/g,'_<wbr>');
  function tabelas(s){
    const b=blocos(s),v=(c,x)=>quebra(s.pronto?(vazio(x)?'':x):mostra(c,x));
    return b.partes.map((p,i)=>'<table class="v278-t"><caption>'+(b.partes.length>1?'Parte '+(i+1)+' de '+b.partes.length+' — ':'')+p.length+' de '+b.cols.length+' coluna(s)'
      +(b.vazias&&!i?' · '+b.vazias+' coluna(s) sem nenhum valor não foram impressas (a planilha Excel traz todas)':'')+'</caption><thead><tr>'+p.map(c=>'<th>'+cabeca(c)+'</th>').join('')+'</tr></thead><tbody>'
      +s.linhas.map(r=>'<tr>'+p.map(c=>'<td>'+v(c,r[c])+'</td>').join('')+'</tr>').join('')+'</tbody></table>').join('');
  }
  function empresa(){
    const reg=$id('regimeEmpresa'),val=id=>($id(id)&&$id(id).value||'').trim();
    return {nome:val('empresa'),cnpj:val('cnpjEmpresa'),regime:reg&&reg.selectedIndex>0?txt(reg.options[reg.selectedIndex]):''};
  }
  function montar(T,secoes,agora){
    const d=empresa(),ni=v=>esc(v||'Não informado');
    return '<div class="v278-cab"><h1>'+esc(T.titulo)+'</h1><span class="v278-marca">Tax<i>Advice</i></span></div>'
      +'<div class="v278-emp"><div><label>Nome da empresa</label><b>'+ni(d.nome)+'</b></div><div><label>CNPJ da empresa</label><b>'+ni(d.cnpj)+'</b></div><div><label>Regime tributário</label><b>'+ni(d.regime)+'</b></div></div>'
      +secoes.map(s=>'<section class="v278-sec"><h2>'+esc(s.titulo)+' <small>'+inteiro(s.linhas.length)+' linha(s)</small></h2>'+(s.nota?'<p class="v278-nota">'+esc(s.nota)+'</p>':'')+tabelas(s)+'</section>').join('')
      +'<div class="v278-rod"><span>Emitido em '+esc(agora)+'</span><span>Desenvolvedor — Carlos Bella · +55 11 99479-7347</span></div>';
  }
  function limpar(){
    delete document.body.dataset.v278Folha;const f=$id('v278-folha');if(f)f.innerHTML='';const p=$id('v278-pagina');if(p)p.remove();
  }
  /* monta a folha e marca a página; devolve false quando não há o que imprimir */
  function preparar(v,silencioso){
    const t=resolver(v),T=TELAS[t],secoes=comLinhas(t);
    if(!T||!secoes.length){if(!silencioso)alert('Não há dados nesta tela para imprimir.');return false}
    const linhas=secoes.reduce((a,s)=>a+s.linhas.length,0);
    const celulas=secoes.reduce((a,s)=>a+s.linhas.length*blocos(s).partes.reduce((x,p)=>x+p.length,0),0);
    if(celulas>LIMITE_CELULAS&&(silencioso||!confirm('Esta impressão é grande: '+inteiro(linhas)+' linha(s). O navegador pode demorar para montar o PDF. Para esse volume o Excel é mais indicado. Continuar com o PDF?')))return false;
    let f=$id('v278-folha');if(!f){f=document.createElement('div');f.id='v278-folha';document.body.appendChild(f)}
    f.innerHTML=montar(T,secoes,new Date().toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'}));
    if(!$id('v278-pagina')){const p=document.createElement('style');p.id='v278-pagina';p.textContent='@media print{@page{size:A4 landscape;margin:8mm}}';document.head.appendChild(p)}
    document.body.dataset.v278Folha=t;
    return {tela:t,arquivo:T.arquivo,linhas};
  }
  let tituloAntes=null;
  function imprimir(v){
    const r=preparar(v);if(!r)return false;
    tituloAntes=document.title;document.title=r.arquivo+'_'+sufixo();
    try{window.print()}catch(e){aoTerminar()}
    return true;
  }
  function aoTerminar(){
    if(tituloAntes!==null){document.title=tituloAntes;tituloAntes=null}
    if('v278Folha' in document.body.dataset)limpar();
  }
  /* tela aberta → folha: usado quando a impressão é pedida pelo navegador (Ctrl+P ou menu Imprimir) */
  function telaAberta(){
    const a=document.querySelector('#v123-sidebar .v123-link.active');if(!a)return '';
    if(a.dataset.v124View)return a.dataset.v124View==='metodologia'?'crono':'';
    return ({documentos:'carga',spedfiscal:'carga',efdcontrib:'carga',nfe:'itens',cte:'itens',nfse:'nfse',ibs:'ibs',calculoitem:'calculoitem',ncmanalise:'ncmanalise',fornecedores:'fornecedores'})[a.dataset.v123Key]||'';
  }
  /* Impressão pedida pelo navegador (Ctrl+P ou menu Imprimir): nas telas que antes saíam em branco ou cortadas,
     a folha é montada aqui. Com a folha pronta, a preparação antiga (V46/V49) não redesenha a tela;
     nas demais telas (Dashboard, Enquadramento, Apuração da CBS) ela continua valendo como antes. */
  const antiga=typeof window.prepararImpressao==='function'?window.prepararImpressao:null;
  if(antiga)window.removeEventListener('beforeprint',antiga);
  window.addEventListener('beforeprint',()=>{
    if('v278Folha' in document.body.dataset)return;
    const t=telaAberta();
    if(t&&preparar(t,true))return;
    if(antiga)antiga();
  });
  window.addEventListener('afterprint',aoTerminar);

  /* ---------- botões ---------- */
  const bExcel=t=>'<button type="button" class="secondary v278-btn" data-v278-excel="'+t+'" title="Todas as linhas desta tela em planilha Excel.">⬇ Exportar Excel</button>';
  const bPdf=t=>'<button type="button" class="secondary v278-btn" data-v278-pdf="'+t+'" title="Abre a impressão do navegador com todas as linhas; escolha Salvar como PDF no destino.">🖨 Imprimir / PDF</button>';
  function instalar(){
    const fim=(alvo,t)=>{if(alvo&&!alvo.querySelector('[data-v278-pdf]'))alvo.insertAdjacentHTML('beforeend','<span class="v278-grupo">'+bExcel(t)+bPdf(t)+'</span>')};
    const depois=(id,t)=>{const b=$id(id);if(b&&b.parentElement&&!b.parentElement.querySelector('[data-v278-pdf]'))b.insertAdjacentHTML('afterend',bPdf(t))};
    const li=$id('loadedInfo');fim(li&&li.parentElement,'carga');
    const ti=$id('tableInfo');fim(ti&&ti.parentElement,'itens');
    depois('expIssV89','nfse');depois('v277Exportar','calculoitem');depois('v253NcmExportar','ncmanalise');depois('v253FornExportar','fornecedores');
    fim(document.querySelector('#v124-metodologia .v168-head'),'crono');
    const pc=document.querySelector('#v153-result .v153-head .v153-print');
    if(pc&&!pc.parentElement.querySelector('[data-v278-excel]'))pc.insertAdjacentHTML('beforebegin',bExcel('consulta'));
  }
  const st=document.createElement('style');st.id='v278-style';
  const P='html body[data-v278-folha]';
  st.textContent=`
#v278-folha{display:none}
.v278-grupo{display:inline-flex;gap:8px;flex-wrap:wrap;margin-left:auto}
.v153-head .v278-btn{margin-left:auto}.v168-head .v278-grupo{align-self:center}
@media print{
.v278-btn,.v278-grupo{display:none!important}
${P}>*:not(#v278-folha):not(#_#_#_):not(#_#_#_){display:none!important}
${P}>#v278-folha:not(#_#_#_):not(#_#_#_){display:block!important;margin:0!important;padding:0!important;background:#fff!important;color:#161616;font:11px system-ui,Segoe UI,Arial,sans-serif}
html:has(body[data-v278-folha]){background:#fff!important;height:auto!important;overflow:visible!important}
${P}{background:#fff!important;margin:0!important;padding:0!important;height:auto!important;overflow:visible!important}
/* Consulta NCM e NBS: a altura mínima da tela e o recuo do topo empurravam uma 2ª página em branco */
html body.v219-modo-consulta:not([data-v278-folha]):not(#_#_#_){min-height:0!important;height:auto!important}
html body.v219-modo-consulta>#v153-result:not(#_#_#_){margin-top:0!important;margin-bottom:0!important}
#v278-folha *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
#v278-folha .v278-cab{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #F26B21;padding-bottom:5px;margin-bottom:8px}
#v278-folha .v278-cab h1{margin:0!important;font:700 17px system-ui!important;color:#0F2A4A!important}
#v278-folha .v278-marca{font:800 18px system-ui;color:#0F2A4A}#v278-folha .v278-marca i{font-style:normal;color:#F26B21}
#v278-folha .v278-emp{display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;margin-bottom:10px}
#v278-folha .v278-emp div{border:1px solid #C6C6C6;padding:5px 8px}
#v278-folha .v278-emp label{display:block;font:600 8.5px system-ui;color:#525252;text-transform:uppercase;letter-spacing:.04em}
#v278-folha .v278-emp b{font:600 12px system-ui}
#v278-folha .v278-sec{margin:0 0 10px}
#v278-folha .v278-sec h2{margin:0 0 3px!important;font:700 13px system-ui!important;color:#0F2A4A!important}
#v278-folha .v278-sec h2 small{font:400 10px system-ui!important;color:#525252}
#v278-folha .v278-nota{margin:0 0 4px;font-size:9.5px;color:#393939}
#v278-folha table.v278-t{width:100%!important;border-collapse:collapse!important;margin:0 0 9px;table-layout:auto;font-size:8.5px!important;line-height:1.25!important}
#v278-folha table.v278-t caption{caption-side:top;text-align:left;font-size:8.5px;color:#525252;padding:0 0 2px}
#v278-folha table.v278-t th,#v278-folha table.v278-t td{border:1px solid #C6C6C6!important;padding:2px 3px!important;text-align:left;vertical-align:top;white-space:normal!important;word-break:normal!important;overflow-wrap:break-word;color:#161616!important;background:#fff}
#v278-folha table.v278-t th{background:#E0E0E0!important;font-weight:700}
#v278-folha table.v278-t thead{display:table-header-group}
#v278-folha table.v278-t tr{break-inside:avoid;page-break-inside:avoid}
#v278-folha .v278-rod{margin-top:10px;padding-top:4px;border-top:1px solid #C6C6C6;font-size:9px;color:#525252;display:flex;justify-content:space-between}
}`;
  document.head.appendChild(st);

  document.addEventListener('click',ev=>{
    const a=ev.target&&ev.target.closest?ev.target:null;if(!a)return;
    if(a.closest('#v123-sidebar,#v123-topbar')){setTimeout(instalar,120);return}
    /* Validação de atividades (CNAE): o Excel do Dashboard não tem quadros nesta visão; exporta a validação */
    if(a.closest('#ibscbs [data-exp="ibscbs"]')){ev.preventDefault();ev.stopPropagation();exportar('ibs');return}
    if(a.closest('#ibscbs .v46-print')){ev.preventDefault();ev.stopPropagation();imprimir('ibs');return}
    const d=a.closest('[data-exp="dashboard"]'),dash=$id('dashboard');
    if(d&&dash&&dash.classList.contains('v156-cnae-mode')){ev.preventDefault();ev.stopPropagation();exportar('cnae')}
  },true);
  document.addEventListener('click',ev=>{
    const a=ev.target&&ev.target.closest?ev.target:null;if(!a)return;
    const x=a.closest('[data-v278-excel]');if(x){exportar(x.dataset.v278Excel);return}
    const p=a.closest('[data-v278-pdf]');if(p)imprimir(p.dataset.v278Pdf);
  });
  instalar();setInterval(instalar,1500);
  window.classificadorV278={TELAS,resolver,telaAberta,secoes:t=>comLinhas(resolver(t)),blocos,montar,preparar,limpar,exportar,imprimir,instalar,MAX_COLUNAS};
  window.V278_CARREGADO=true;
})();
