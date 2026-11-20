/* V256 — Apuração assistida da CBS (etapas 1 e 2), no padrão dos arquivos de retorno da Receita Federal
   (docs.receitafederal.gov.br/apuracao-cbs, versão 1.3 de 13/11/2026):
   1) apuração prévia por período de apuração (PA) e documento, com os arquivos carregados na ferramenta;
   2) conciliação com os JSON oficiais de débitos, créditos, pagamentos e recolhimentos baixados da Receita.
   Tudo é processado no navegador: nenhum arquivo, credencial ou URL assinada é enviado ou armazenado.
   A API da Receita cobre somente a CBS; o IBS não entra nesta apuração. */
(function(){
  if (window.V256_CARREGADO) return;
  const ORIGENS={0:'NORMAL',20:'DEVOLUCAO_POR_PCONT',21:'DEVOLUCAO_POR_RAD',22:'DEVOLUCAO_POR_CREDITO',30:'CANCELAMENTO_CREDITO',31:'CANCELAMENTO_RAD',32:'CANCELAMENTO_PCONT',50:'PERECIMENTO_TRANSPORTE_FOB',51:'PERECIMENTO_TRANSPORTE_CIF',52:'DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_PCONT',53:'DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_RAD',54:'DEVOLUCAO_PERECIMENTO_TRANSPORTE_CIF_POR_CREDITO',55:'NOTA_CREDITO_MULTA_JUROS'};
  const DOCUMENTOS={55:'NF-e',57:'CT-e',62:'NFCom',63:'BP-e',64:'GTV-e',65:'NFC-e',66:'NF3-e',67:'CT-e OS',91:'NFS-e',92:'NFS-e Via',93:'BP-e TM',94:'DERE',97:'CT-e Simplificado'};
  const TOL=0.01;
  const dig=v=>String(v??'').replace(/\D/g,'');
  const n2=v=>Math.round((Number(v)||0)*100)/100;
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const real=v=>'R$ '+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0);
  const numero=v=>typeof num==='function'?num(v):(Number(v)||0);
  const grupo=(r,g,t)=>typeof valorGrupo==='function'?valorGrupo(r,g,t):0;
  const novaReceita=()=>({debitos:new Map,creditos:new Map,pagamentos:[],recolhimentos:[]});
  const estado={receita:novaReceita(),arquivos:[]};

  /* ---------- etapa 1: apuração prévia com os arquivos carregados ---------- */
  function paDe(data){
    const s=String(data||'');let m=s.match(/^(\d{4})-(\d{2})/);if(m)return m[2]+'/'+m[1];
    m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})/);if(m)return m[2]+'/'+m[3];
    m=s.match(/^(\d{2})(\d{2})(\d{4})$/);if(m)return m[2]+'/'+m[3];return '';
  }
  function modeloDe(r){
    const ch=dig(r.chave_documento);if(ch.length===44){const m=Number(ch.slice(20,22));if(DOCUMENTOS[m])return m}
    const m=Number(dig(r.modelo));if(DOCUMENTOS[m])return m;
    const t=String(r.tipo_documento||'').toUpperCase();
    if(/NFS/.test(t))return 91;if(/CT-?E/.test(t))return 57;if(/NFC-?E/.test(t)&&!/NF-E/.test(t))return 65;return 55;
  }
  function estimativa(r,pa){
    try{
      const i=Number(pa.slice(3))-2026;if(!(i>=0&&i<=7)||typeof window.v253TaxasAno!=='function')return null;
      const nfse=/NFS/i.test(String(r.tipo_documento||''));
      const ef=typeof window.v253Efeito==='function'?window.v253Efeito(nfse?'SERVIÇO':'NCM',nfse?(r.dados_nfse?.codigo_servico||''):dig(r.ncm),r):null;
      const t=window.v253TaxasAno(i,ef&&ef.ref?ef.ref.reducao:null);
      const base=grupo(r,'IBS','vBC')||grupo(r,'CBS','vBC')||numero(r.valor_item);
      return {valor:n2(base*t.cbs/100),revisao:!!(ef&&ef.revisao)};
    }catch(x){return null}
  }
  function previa(itens){
    const docs=new Map;
    for(const r of itens||[]){
      const pa=paDe(r.data_emissao),op=String((typeof tipoOperacao==='function'?tipoOperacao(r):r.tipo_operacao)||'').toUpperCase();
      const lado=/SA[IÍ]DA/.test(op)?'debitos':/ENTRADA/.test(op)?'creditos':'';
      const chave=dig(r.chave_documento)||('SEM-CHAVE|'+(r.numero_documento||'')+'|'+dig(r.emitente_cnpj_cpf));
      const k=[lado,pa,chave].join('|');
      const d=docs.get(k)||{lado,pa,chave,chaveValida:dig(r.chave_documento).length>=44,documento:modeloDe(r),numero:r.numero_documento||'',emissao:r.data_emissao||'',
        participante:lado==='debitos'?(r.destinatario_razao_social||''):(r.emitente_razao_social||''),niParticipante:dig(lado==='debitos'?r.destinatario_cnpj_cpf:r.emitente_cnpj_cpf),
        itens:0,valor:0,base:0,cbsDestacada:0,cbsEstimada:0,revisao:false};
      d.itens++;d.valor+=numero(r.valor_item);d.base+=grupo(r,'IBS','vBC')||grupo(r,'CBS','vBC');
      const dest=grupo(r,'CBS','vCBS');d.cbsDestacada+=dest;
      if(!dest){const est=estimativa(r,pa);if(est){d.cbsEstimada+=est.valor;if(est.revisao)d.revisao=true}}
      docs.set(k,d);
    }
    const lista=[...docs.values()].map(d=>{
      d.valor=n2(d.valor);d.base=n2(d.base);d.cbsDestacada=n2(d.cbsDestacada);d.cbsEstimada=n2(d.cbsEstimada);
      d.fonte=d.cbsDestacada>0&&d.cbsEstimada>0?'Destacada + estimada':d.cbsDestacada>0?'Destacada no documento':d.cbsEstimada>0?'Estimada pelo cronograma':'Sem CBS';
      d.cbs=n2(d.cbsDestacada+d.cbsEstimada);
      d.pendencias=[!d.lado?'Operação não identificada (entrada ou saída)':'',!d.pa?'Data de emissão ausente':'',!d.chaveValida?'Sem chave de acesso de 44 dígitos':'',d.revisao?'Enquadramento em revisão — estimativa sem redução':''].filter(Boolean);
      return d});
    const pas=new Map;
    for(const d of lista){if(!d.lado||!d.pa)continue;
      const p=pas.get(d.pa)||{pa:d.pa,debitos:0,creditos:0,debitosDestacados:0,creditosDestacados:0,docsDebito:0,docsCredito:0};
      if(d.lado==='debitos'){p.debitos+=d.cbs;p.debitosDestacados+=d.cbsDestacada;p.docsDebito++}else{p.creditos+=d.cbs;p.creditosDestacados+=d.cbsDestacada;p.docsCredito++}
      pas.set(d.pa,p)}
    const ordem=p=>p.pa.slice(3)+p.pa.slice(0,2);
    const periodos=[...pas.values()].map(p=>({...p,debitos:n2(p.debitos),creditos:n2(p.creditos),debitosDestacados:n2(p.debitosDestacados),creditosDestacados:n2(p.creditosDestacados),saldo:n2(p.debitos-p.creditos)}))
      .sort((a,b)=>ordem(a).localeCompare(ordem(b)));
    return {documentos:lista,periodos};
  }

  /* ---------- etapa 2: leitura e validação dos JSON oficiais ---------- */
  const ehPa=x=>/^(0[1-9]|1[0-2])\/\d{4}$/.test(String(x||''));
  const rotulo=t=>({debitos:'Débitos',creditos:'Créditos',pagamentos:'Pagamentos (PCONT e RAD)',recolhimentos:'Recolhimentos como adquirente (RAD)'}[t]||t);
  function tipoArquivo(j){
    const ap=Array.isArray(j?.apuracao)?j.apuracao:null;if(!ap)return '';
    if(ap.some(a=>Array.isArray(a?.debitos)))return 'debitos';
    if(ap.some(a=>Array.isArray(a?.creditos)))return 'creditos';
    if(ap.some(a=>Array.isArray(a?.pagamentos))){
      const pg=ap.flatMap(a=>a.pagamentos||[]);
      return pg.some(p=>(p.composicao||[]).some(c=>c.niFornecedor))&&!pg.some(p=>p.tipo===2||p.niAdquirente||p.niContribuinte)?'recolhimentos':'pagamentos'}
    return ap.length?'':'vazio';
  }
  function validar(j,tipo){
    const er=[];
    if(!j||typeof j!=='object'||Array.isArray(j))return ['O arquivo não é um objeto JSON.'];
    if(typeof j.tiqueteSolicitacao!=='string'||!j.tiqueteSolicitacao)er.push('Campo obrigatório ausente: tiqueteSolicitacao.');
    if(!/^\d{8}$/.test(String(j.ni||'')))er.push('Campo ni deve ter o CNPJ base de 8 dígitos.');
    if(!/^(\d{11}|\d{14})$/.test(String(j.niConsumidor||'')))er.push('Campo niConsumidor deve ter 11 ou 14 dígitos.');
    if(!j.geradoEm||Number.isNaN(Date.parse(j.geradoEm)))er.push('Campo geradoEm ausente ou fora do padrão ISO 8601.');
    if(!Array.isArray(j.apuracao))return er.concat('Campo apuracao ausente ou não é uma lista.');
    j.apuracao.forEach((a,i)=>{const onde='apuracao['+i+']';
      if(tipo==='debitos'||tipo==='creditos'){
        if(!ehPa(a.pa))er.push(onde+'.pa fora do padrão MM/AAAA.');
        const l=a[tipo];if(!Array.isArray(l)||!l.length){er.push(onde+'.'+tipo+' deve ter ao menos um registro.');return}
        l.forEach((x,k)=>{const o=onde+'.'+tipo+'['+k+']';
          if(!Number.isInteger(x.origem)||!(x.origem in ORIGENS))er.push(o+'.origem inválida.');
          if(!Number.isInteger(x.documento)||!(x.documento in DOCUMENTOS))er.push(o+'.documento inválido.');
          if(typeof x.chave!=='string'||!x.chave||x.chave.length>100)er.push(o+'.chave ausente ou maior que 100 caracteres.');
          for(const c of ['emissao','registro','atualizacao'])if(!x[c]||Number.isNaN(Date.parse(x[c])))er.push(o+'.'+c+' ausente ou inválido.');
          if(!x.cbs||typeof x.cbs.apurado!=='number')er.push(o+'.cbs.apurado ausente.');
          else if(tipo==='debitos'&&typeof x.cbs.saldoDevedor!=='number')er.push(o+'.cbs.saldoDevedor ausente.');
          else if(tipo==='creditos'&&typeof x.cbs.apropriacao?.utilizacao?.naoUtilizado?.saldoCredor!=='number')er.push(o+'.cbs.apropriacao.utilizacao.naoUtilizado.saldoCredor ausente.')})
      }else if(tipo==='pagamentos'||tipo==='recolhimentos'){
        if(!/^\d{4}-\d{2}-\d{2}$/.test(String(a.dataArrecadacao||'')))er.push(onde+'.dataArrecadacao fora do padrão AAAA-MM-DD.');
        if(!Array.isArray(a.pagamentos)||!a.pagamentos.length){er.push(onde+'.pagamentos deve ter ao menos um registro.');return}
        a.pagamentos.forEach((p,k)=>{const o=onde+'.pagamentos['+k+']';
          if(!/^\d{17}$/.test(String(p.numeroDARF||'')))er.push(o+'.numeroDARF deve ter 17 dígitos.');
          if(![1,2].includes(p.tipo))er.push(o+'.tipo deve ser 1 (RAD) ou 2 (PCONT).');
          if(!Array.isArray(p.composicao)||!p.composicao.length){er.push(o+'.composicao deve ter ao menos um item.');return}
          p.composicao.forEach((c,q)=>{const oc=o+'.composicao['+q+']';if(!ehPa(c.pa))er.push(oc+'.pa fora do padrão MM/AAAA.');
            for(const f of ['principal','multa','juros','total'])if(typeof c[f]!=='number')er.push(oc+'.'+f+' ausente.')})})
      }});
    return er.slice(0,12);
  }
  function registrar(nome,tipo,ni,erros,registros,j){
    const r={nome:String(nome||'arquivo.json'),tipo:tipo||'Não reconhecido',ni:String(ni||''),geradoEm:j?.geradoEm||'',registros,erros};
    estado.arquivos.push(r);return r;
  }
  function importar(texto,nome){
    let j;try{j=JSON.parse(texto)}catch(x){return registrar(nome,'','',['Arquivo não é um JSON válido.'],0)}
    const tipo=tipoArquivo(j);
    if(!tipo)return registrar(nome,'',j?.ni,['Estrutura não reconhecida: esperado o arquivo de retorno de débitos, créditos, pagamentos ou recolhimentos da apuração da CBS.'],0);
    if(tipo==='vazio')return registrar(nome,'Sem registros no período',j.ni,validar(j,''),0,j);
    const er=validar(j,tipo);if(er.length)return registrar(nome,rotulo(tipo),j.ni,er,0,j);
    let qtd=0;
    if(tipo==='debitos'||tipo==='creditos'){
      for(const a of j.apuracao)for(const x of a[tipo]){
        const k=a.pa+'|'+(dig(x.chave)||x.chave)+'|'+x.origem,ant=estado.receita[tipo].get(k);
        /* arquivos incrementais: prevalece o registro com a atualização mais recente */
        if(ant&&Date.parse(ant.atualizacao)>Date.parse(x.atualizacao))continue;
        estado.receita[tipo].set(k,{pa:a.pa,chave:dig(x.chave)||x.chave,origem:x.origem,documento:x.documento,emissao:x.emissao,registro:x.registro,atualizacao:x.atualizacao,cbs:x.cbs});qtd++}
    }else{
      for(const a of j.apuracao)for(const p of a.pagamentos)for(const c of p.composicao){
        const reg={dataArrecadacao:a.dataArrecadacao,numeroDARF:p.numeroDARF,tipo:p.tipo,niAdquirente:p.niAdquirente||'',niContribuinte:c.niContribuinte||p.niContribuinte||'',niFornecedor:c.niFornecedor||'',
          sequencial:c.sequencial,pa:c.pa,vencimento:c.vencimento||'',chaveDFE:dig(c.chaveDFE),principal:c.principal,multa:c.multa,juros:c.juros,total:c.total};
        const l=estado.receita[tipo],i=l.findIndex(y=>y.numeroDARF===reg.numeroDARF&&y.sequencial===reg.sequencial);
        if(i>=0)l[i]=reg;else l.push(reg);qtd++}
    }
    return registrar(nome,rotulo(tipo),j.ni,[],qtd,j);
  }
  function limpar(){estado.receita=novaReceita();estado.arquivos=[];}

  /* ---------- etapa 2: conciliação documento a documento ---------- */
  function conciliar(apur){
    const linhas=[];
    for(const lado of ['debitos','creditos']){
      const rec=new Map;
      for(const x of estado.receita[lado].values()){
        const k=x.pa+'|'+x.chave,g=rec.get(k)||{pa:x.pa,chave:x.chave,documento:x.documento,apurado:0,ajustes:0,origens:new Set,saldo:0,extinto:0,suspenso:0,excedente:0};
        const ap=Number(x.cbs?.apurado)||0;
        if(x.origem===0)g.apurado+=ap;else{g.ajustes+=ap;g.origens.add(ORIGENS[x.origem])}
        g.excedente+=Number(x.cbs?.excedente)||0;
        if(lado==='debitos'){g.saldo+=Number(x.cbs?.saldoDevedor)||0;g.extinto+=(Number(x.cbs?.extinto)||0)+(Number(x.cbs?.pgtoAntecipado)||0);g.suspenso+=Number(x.cbs?.suspenso)||0}
        else{const a=x.cbs?.apropriacao||{};g.saldo+=Number(a.utilizacao?.naoUtilizado?.saldoCredor)||0;g.extinto+=Number(a.utilizacao?.utilizado)||0;g.suspenso+=Number(a.suspenso)||0}
        rec.set(k,g)}
      const vistos=new Set;
      for(const d of apur.documentos){
        if(d.lado!==lado)continue;const k=d.pa+'|'+d.chave,g=rec.get(k);vistos.add(k);
        let situacao,dif=null;
        if(!g)situacao=estado.receita[lado].size?'Só nos arquivos':'Aguardando JSON da Receita';
        else{dif=n2(d.cbs-g.apurado);situacao=Math.abs(dif)<=TOL?'Confere':'Valor diferente'}
        linhas.push({lado,pa:d.pa,chave:d.chave,documento:DOCUMENTOS[d.documento],numero:d.numero,participante:d.participante,cbsArquivos:d.cbs,fonte:d.fonte,
          cbsReceita:g?n2(g.apurado):null,diferenca:dif,ajustes:g?n2(g.ajustes):null,origens:g?[...g.origens].join(', '):'',excedente:g?n2(g.excedente):null,
          extinto:g?n2(g.extinto):null,suspenso:g?n2(g.suspenso):null,saldo:g?n2(g.saldo):null,situacao,pendencias:d.pendencias.join('; ')})}
      for(const [k,g] of rec){if(vistos.has(k))continue;
        linhas.push({lado,pa:g.pa,chave:g.chave,documento:DOCUMENTOS[g.documento],numero:'',participante:'',cbsArquivos:null,fonte:'',cbsReceita:n2(g.apurado),diferenca:n2(-g.apurado),
          ajustes:n2(g.ajustes),origens:[...g.origens].join(', '),excedente:n2(g.excedente),extinto:n2(g.extinto),suspenso:n2(g.suspenso),saldo:n2(g.saldo),situacao:'Só na Receita',pendencias:'Documento não carregado na ferramenta'})}
    }
    const resumo={};for(const l of linhas){const r=resumo[l.situacao]||(resumo[l.situacao]={qtd:0});r.qtd++}
    const pag=new Map;
    for(const [tipo,lista] of [['pagamentos',estado.receita.pagamentos],['recolhimentos',estado.receita.recolhimentos]])for(const p of lista){
      const k=p.pa+'|'+tipo+'|'+p.tipo,g=pag.get(k)||{pa:p.pa,natureza:tipo==='recolhimentos'?'RAD recolhido como adquirente':p.tipo===1?'RAD recolhido pelos adquirentes':'PCONT pago pelo contribuinte',qtd:0,principal:0,multa:0,juros:0,total:0};
      g.qtd++;for(const f of ['principal','multa','juros','total'])g[f]=n2(g[f]+p[f]);pag.set(k,g)}
    return {linhas,resumo,pagamentos:[...pag.values()]};
  }

  /* ---------- tela ---------- */
  const $=id=>document.getElementById(id);
  const cor=s=>s==='Confere'?'verde':s==='Valor diferente'||s==='Só na Receita'?'vermelho':s==='Só nos arquivos'?'amarelo':'cinza';
  const v=x=>x===null||x===undefined?'—':real(x);
  let ultimo=null;
  function render(){
    const sec=$('apuracaocbs');if(!sec)return;
    const itens=(typeof state!=='undefined'&&state.items)||[],ap=previa(itens),co=conciliar(ap);ultimo={ap,co};
    const temRec=estado.receita.debitos.size||estado.receita.creditos.size||estado.receita.pagamentos.length||estado.receita.recolhimentos.length;
    $('v256Periodos').innerHTML=ap.periodos.length?'<table id="v256PeriodosTable"><thead><tr><th>Período (PA)</th><th>Documentos de saída</th><th>Débitos de CBS</th><th>dos quais destacados</th><th>Documentos de entrada</th><th>Créditos de CBS</th><th>dos quais destacados</th><th>Saldo prévio (débitos − créditos)</th><th>Resultado</th></tr></thead><tbody>'
      +ap.periodos.map(p=>'<tr><td><b>'+e(p.pa)+'</b></td><td>'+p.docsDebito+'</td><td>'+real(p.debitos)+'</td><td>'+real(p.debitosDestacados)+'</td><td>'+p.docsCredito+'</td><td>'+real(p.creditos)+'</td><td>'+real(p.creditosDestacados)+'</td><td><b>'+real(p.saldo)+'</b></td><td>'+(p.saldo>0?'A recolher':p.saldo<0?'Saldo credor':'Zerado')+'</td></tr>').join('')+'</tbody></table>'
      :'<p class="empty">Carregue e processe XML, PDF, SPED Fiscal ou EFD Contribuições para montar a apuração prévia.</p>';
    $('v256Arquivos').innerHTML=estado.arquivos.length?'<table><thead><tr><th>Arquivo</th><th>Tipo</th><th>CNPJ base (ni)</th><th>Gerado em</th><th>Registros lidos</th><th>Validação</th></tr></thead><tbody>'
      +estado.arquivos.map(a=>'<tr><td>'+e(a.nome)+'</td><td>'+e(a.tipo)+'</td><td>'+e(a.ni)+'</td><td>'+e(a.geradoEm)+'</td><td>'+a.registros+'</td><td>'+(a.erros.length?'<span class="v253-semaforo vermelho">Recusado</span><small> '+a.erros.map(e).join(' ')+'</small>':'<span class="v253-semaforo verde">Estrutura válida</span>')+'</td></tr>').join('')+'</tbody></table>'
      :'<p class="empty">Nenhum JSON da Receita importado.</p>';
    const filtro=$('v256Filtro')?.value||'',lado=$('v256Lado')?.value||'';
    const linhas=co.linhas.filter(l=>(!filtro||l.situacao===filtro)&&(!lado||l.lado===lado));
    $('v256Resumo').textContent=co.linhas.length?Object.entries(co.resumo).map(([k,r])=>k+': '+r.qtd).join(' · ')+(temRec?'':' — importe os JSON da Receita para conciliar.'):'Sem documentos para conciliar.';
    $('v256Linhas').innerHTML=linhas.length?'<table id="v256Table"><thead><tr><th>Situação</th><th>Tipo</th><th>PA</th><th>Documento</th><th>Chave</th><th>Participante</th><th>CBS nos arquivos</th><th>Origem do valor</th><th>CBS apurada na Receita</th><th>Diferença</th><th>Ajustes (outras origens)</th><th>Extinto / utilizado</th><th>Suspenso</th><th>Saldo na Receita</th><th>Pendências</th></tr></thead><tbody>'
      +linhas.slice(0,2000).map(l=>'<tr><td><span class="v253-semaforo '+cor(l.situacao)+'">'+e(l.situacao)+'</span></td><td>'+(l.lado==='debitos'?'Débito':l.lado==='creditos'?'Crédito':'—')+'</td><td>'+e(l.pa||'—')+'</td><td>'+e(l.documento||'')+(l.numero?' '+e(l.numero):'')+'</td><td class="v256-chave">'+e(l.chave)+'</td><td>'+e(l.participante)+'</td><td>'+v(l.cbsArquivos)+'</td><td>'+e(l.fonte)+'</td><td>'+v(l.cbsReceita)+'</td><td>'+v(l.diferenca)+'</td><td>'+v(l.ajustes)+(l.origens?'<small> '+e(l.origens)+'</small>':'')+'</td><td>'+v(l.extinto)+'</td><td>'+v(l.suspenso)+'</td><td>'+v(l.saldo)+'</td><td>'+e(l.pendencias)+'</td></tr>').join('')+'</tbody></table>'
        +(linhas.length>2000?'<p class="hint">Exibindo 2.000 de '+linhas.length+' linhas; a exportação em Excel traz todas.</p>':'')
      :'<p class="empty">Nenhuma linha para os filtros escolhidos.</p>';
    $('v256Pagamentos').innerHTML=co.pagamentos.length?'<table><thead><tr><th>PA</th><th>Natureza</th><th>Itens</th><th>Principal</th><th>Multa</th><th>Juros</th><th>Total</th></tr></thead><tbody>'
      +co.pagamentos.map(p=>'<tr><td>'+e(p.pa)+'</td><td>'+e(p.natureza)+'</td><td>'+p.qtd+'</td><td>'+real(p.principal)+'</td><td>'+real(p.multa)+'</td><td>'+real(p.juros)+'</td><td>'+real(p.total)+'</td></tr>').join('')+'</tbody></table>'
      :'<p class="empty">Nenhum pagamento ou recolhimento importado.</p>';
    const c=document.querySelector('[data-v123-count="apuracaocbs"]');if(c)c.textContent=String(ap.documentos.filter(d=>d.lado&&d.pa).length);
  }
  function exportar(){
    if(!ultimo||!ultimo.ap.documentos.length)return alert('Não há apuração para exportar.');
    if(typeof gerarXlsx!=='function')return;
    gerarXlsx('APURACAO_ASSISTIDA_CBS_'+new Date().toISOString().slice(0,10)+'.xlsx',[['Apuração prévia por PA',ultimo.ap.periodos],['Conciliação',ultimo.co.linhas],
      ['Documentos',ultimo.ap.documentos.map(d=>({tipo:d.lado,pa:d.pa,chave:d.chave,documento:DOCUMENTOS[d.documento],numero:d.numero,participante:d.participante,ni_participante:d.niParticipante,itens:d.itens,valor:d.valor,base:d.base,cbs_destacada:d.cbsDestacada,cbs_estimada:d.cbsEstimada,cbs:d.cbs,origem_valor:d.fonte,pendencias:d.pendencias.join('; ')}))],
      ['Pagamentos',ultimo.co.pagamentos.length?ultimo.co.pagamentos:[{pa:'',natureza:'Nenhum pagamento importado'}]]]);
  }
  async function lerArquivos(files){
    for(const f of files||[]){try{importar(await f.text(),f.name)}catch(x){registrar(f.name,'','',['Não foi possível ler o arquivo.'],0)}}
    render();
  }
  function criar(){
    if($('apuracaocbs'))return;
    const ref=document.querySelector('.tab[data-tab="icms"]'),sec=$('icms');if(!ref||!sec)return;
    ref.insertAdjacentHTML('beforebegin','<button class="tab" data-tab="apuracaocbs">Apuração CBS</button>');
    sec.insertAdjacentHTML('beforebegin','<section id="apuracaocbs" class="panel">'
      +'<div class="card"><b class="v256-t" style="font-size:17px">Apuração assistida da CBS</b><span class="hint">Padrão dos arquivos de retorno da Receita Federal (apuração da CBS, versão 1.3). Etapa 1: apuração prévia com os documentos carregados. Etapa 2: conciliação com os JSON baixados da Receita. A API da Receita cobre somente a CBS; os arquivos são lidos neste computador e não são enviados.</span></div>'
      +'<div class="card"><b class="v256-t">1. Apuração prévia por período</b><span class="hint">Débitos = CBS dos documentos de saída; créditos = CBS dos documentos de entrada. Quando o documento não destaca CBS, o valor é estimado pelo cronograma (CBS do ano × base, com a redução do enquadramento) e identificado como estimativa.</span><div class="table-wrap" id="v256Periodos"></div></div>'
      +'<div class="card"><b class="v256-t">2. Arquivos da Receita Federal</b><span class="hint">Importe os JSON de débitos, créditos, pagamentos e recolhimentos obtidos no download da apuração da CBS. Arquivos incrementais podem ser somados: prevalece a atualização mais recente de cada registro.</span>'
      +'<div class="v253-filtros"><input type="file" id="v256Arquivo" accept=".json,application/json" multiple><button type="button" id="v256Limpar" class="secondary">Remover JSON importados</button></div><div class="table-wrap" id="v256Arquivos"></div></div>'
      +'<div class="card"><b class="v256-t">3. Conciliação por documento</b><div class="v253-filtros"><select id="v256Lado"><option value="">Débitos e créditos</option><option value="debitos">Somente débitos</option><option value="creditos">Somente créditos</option></select>'
      +'<select id="v256Filtro"><option value="">Situação: todas</option><option>Confere</option><option>Valor diferente</option><option>Só na Receita</option><option>Só nos arquivos</option><option>Aguardando JSON da Receita</option></select>'
      +'<button type="button" id="v256Exportar" class="secondary">⬇ Exportar Excel</button></div><div id="v256Resumo" class="hint" style="margin-top:6px"></div><div class="table-wrap" style="max-height:560px" id="v256Linhas"></div></div>'
      +'<div class="card"><b class="v256-t">4. Pagamentos e recolhimentos</b><div class="table-wrap" id="v256Pagamentos"></div></div></section>');
    const st=document.createElement('style');st.textContent='.v256-t{display:block;font-size:15px;color:#0F2A4A;margin-bottom:4px}.v256-chave{font-size:11px;word-break:break-all;max-width:230px}#apuracaocbs .hint{display:block}#apuracaocbs td small{color:#5B6B7C}#apuracaocbs .empty{padding:14px;color:#5B6B7C}#apuracaocbs .table-wrap{height:auto!important;min-height:0!important;margin-top:8px}';document.head.appendChild(st);
    const tab=document.querySelector('.tab[data-tab="apuracaocbs"]');
    tab.onclick=()=>{document.querySelectorAll('.tab,.panel').forEach(x=>x.classList.remove('active'));tab.classList.add('active');$('apuracaocbs').classList.add('active');render();const titulo=()=>{const t=$('v123-title');if(t&&$('apuracaocbs').classList.contains('active'))t.textContent='Apuração assistida da CBS'};titulo();setTimeout(titulo,0)};
    const side=$('v123-sidebar');
    if(side){const b=document.createElement('button');b.className='v123-link';b.dataset.v123Tab='apuracaocbs';b.dataset.v123Key='apuracaocbs';b.innerHTML='Apuração assistida da CBS<small data-v123-count="apuracaocbs">0</small>';
      const r=side.querySelector('[data-v123-key="ncmanalise"]')||side.querySelector('[data-v123-key="ibs"]');if(r)r.after(b);else side.appendChild(b)}
    $('v256Arquivo').addEventListener('change',ev=>{lerArquivos([...ev.target.files]).then(()=>{ev.target.value=''})});
    $('v256Limpar').onclick=()=>{limpar();render()};$('v256Exportar').onclick=exportar;
    for(const id of ['v256Lado','v256Filtro'])$(id).addEventListener('input',render);
  }
  criar();
  const anterior=window.renderAba;
  if(typeof anterior==='function')window.renderAba=function(id){if(id==='apuracaocbs'){render();return}return anterior(id)};
  window.classificadorV256={previa,importar,conciliar,validar,tipoArquivo,limpar,render,estado,ORIGENS,DOCUMENTOS};
  window.V256_CARREGADO=true;
})();
