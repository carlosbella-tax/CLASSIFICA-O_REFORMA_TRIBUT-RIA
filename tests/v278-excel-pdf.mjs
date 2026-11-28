/* V278 — Regressão: Excel e PDF em todas as telas do menu.
   Abre o build no navegador simulado com os XMLs de tests/fixtures mais uma carga sintética (NF-e, NFS-e,
   SPED Fiscal e EFD Contribuições), percorre o menu e confere: os dois botões em cada tela, as planilhas
   gravadas no .xlsx (lidas de dentro do arquivo), a folha de impressão com todas as linhas e a empresa
   informada, a divisão das tabelas largas, os filtros, o Ctrl+P e a limpeza depois de imprimir. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';
import {abrirDiagnostico} from '../tools/navegador.mjs';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const pasta=path.join(root,'tests/fixtures');
const arquivos=fs.readdirSync(pasta).filter(n=>/\.xml$/i.test(n)).sort().map(n=>path.join(pasta,n));
const {w,erros}=await abrirDiagnostico(arquivos,{campos:{empresa:'CLIENTE TESTE LTDA',cnpjEmpresa:'11.222.333/0001-81'}});
const d=w.document,esperar=ms=>new Promise(r=>setTimeout(r,ms));
w.classificadorAplicarAcessoV229?.('admin');
const avisos=[];w.alert=m=>avisos.push(String(m));w.confirm=()=>true;
let impressoes=0;w.print=()=>{impressoes++};
const blobs=[];w.URL.createObjectURL=b=>{blobs.push(b);return 'blob:teste'};
let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V278: '+nome)};
const V=w.classificadorV278;
const puro=x=>JSON.parse(JSON.stringify(x));   /* listas criadas dentro da página → listas deste processo */

/* ---- leitura do .xlsx gerado (zip sem compressão) ---- */
async function planilhas(blob){
  const u=new Uint8Array(await blob.arrayBuffer()),dv=new DataView(u.buffer),dec=new TextDecoder,arq={};
  for(let p=0;p+30<u.length&&dv.getUint32(p,true)===0x04034b50;){
    const tam=dv.getUint32(p+18,true),n=dv.getUint16(p+26,true),x=dv.getUint16(p+28,true),ini=p+30+n+x;
    arq[dec.decode(u.subarray(p+30,p+30+n))]=dec.decode(u.subarray(ini,ini+tam));p=ini+tam}
  const nomes=[...arq['xl/workbook.xml'].matchAll(/<sheet name="([^"]*)"/g)].map(m=>m[1].replace(/&amp;/g,'&'));
  return nomes.map((nome,i)=>{const x=arq['xl/worksheets/sheet'+(i+1)+'.xml'];return {nome,linhas:(x.match(/<row /g)||[]).length-1,xml:x}});
}
/* clica no botão de Excel e devolve as planilhas do arquivo, sem a capa de identificação */
async function excel(botao){
  assert.ok(botao,'botão de Excel não encontrado');blobs.length=0;botao.click();await esperar(30);
  assert.equal(blobs.length,1,'o clique deve gerar um arquivo');
  const p=await planilhas(blobs[0]);assert.match(p[0].nome,/^Auditoria Classificação/);return p.slice(1);   /* a 1ª planilha é a capa de identificação */
}
const menu=async k=>{const b=k==='crono'?d.querySelector('#v123-sidebar [data-v124-view="metodologia"]'):d.querySelector('#v123-sidebar [data-v123-key="'+k+'"]');assert.ok(b,'menu '+k);b.click();await esperar(200);V.instalar()};
const folha=()=>d.getElementById('v278-folha');
const linhasFolha=()=>[...folha().querySelectorAll('table.v278-t')].map(t=>t.tBodies[0].rows.length);
const texto=()=>folha().textContent.replace(/\s+/g,' ');

/* ---- carga sintética: passa de 200 linhas (limite antigo da tela) e traz os quatro tipos de documento ---- */
const base=w.eval('state.items.slice()'),nBase=base.length;
w.eval(`(function(){
  const base=state.items.slice(),ncms=['02023000','22030000','84713000','85287200','48181000'];
  for(let i=0;i<260;i++){const o=Object.assign({},base[i%base.length]);o.numero_documento=String(20000+i);o.chave_documento='NFE'+(20000+i);o.ncm=ncms[i%ncms.length];o.descricao_item='PRODUTO <b>DE</b> TESTE '+i;state.items.push(o)}
  for(let i=0;i<30;i++)state.items.push({arquivo_origem:'NFSE'+i+'.xml',tipo_documento:'NFS-e',numero_documento:String(700+i),chave_documento:'NFSE'+(700+i),data_emissao:'2026-11-03',emitente_cnpj_cpf:'47960950000121',emitente_razao_social:'PRESTADOR DE SERVICOS LTDA',destinatario_cnpj_cpf:'11222333000181',numero_item:1,descricao_item:'Consultoria '+i,valor_item:2000+i,dados_nfse:{codigo_servico:'17.01',nbs:'1.1401.11.00',descricao_servico:'Consultoria '+i,valor_servico:2000+i,valor_iss:100,aliquota_iss:5}});
  for(let i=0;i<12;i++)state.items.push({arquivo_origem:'EFD.txt',tipo_documento:'SPED EFD ICMS/IPI',numero_documento:String(9000+i),chave_documento:'SPED|'+(9000+i),data_emissao:'2026-11-03',emitente_cnpj_cpf:'33000167000101',emitente_razao_social:'INDUSTRIA ALFA S.A.',numero_item:1+(i%2),descricao_item:'Item SPED '+i,ncm:'84713000',valor_item:1000+i});
  for(let i=0;i<7;i++)state.items.push({arquivo_origem:'CONTRIB.txt',tipo_documento:'SPED EFD Contribuições',numero_documento:String(9500+i),chave_documento:'SPED|'+(9500+i),data_emissao:'2026-11-03',emitente_cnpj_cpf:'33000167000101',emitente_razao_social:'INDUSTRIA ALFA S.A.',numero_item:1,descricao_item:'Item EFD '+i,ncm:'84713000',valor_item:500+i});
  const v=new Set;state.docs=state.items.filter(r=>!v.has(r.chave_documento)&&v.add(r.chave_documento)).map(r=>({arquivo_origem:r.arquivo_origem,chave_documento:r.chave_documento,numero_documento:r.numero_documento,tipo_documento:r.tipo_documento,emitente_razao_social:r.emitente_razao_social}));
  render();
})()`);
const nItens=w.eval('state.items.length'),nDocs=w.eval('state.docs.length');
assert.equal(nItens,nBase+260+30+12+7);

await teste('módulo carregado e uma folha de impressão própria, fora das telas',()=>{
  assert.equal(w.V278_CARREGADO,true);assert.equal(V.MAX_COLUNAS,12);
  for(const k of ['documentos','spedfiscal','efdcontrib','itens','nfse','ibs','calculoitem','ncmanalise','fornecedores','crono','cnae','consulta'])assert.ok(V.TELAS[k],'tela '+k)});

await teste('Carregar XML/PDF: Excel e PDF com todos os documentos carregados',async()=>{
  await menu('documentos');
  const x=d.querySelector('[data-v278-excel="carga"]'),p=d.querySelector('[data-v278-pdf="carga"]');assert.ok(x&&p);assert.equal(V.resolver('carga'),'documentos');
  const pl=await excel(x);assert.equal(pl[0].nome,'Documentos carregados');assert.equal(pl[0].linhas,nDocs);
  const r=V.preparar('carga');assert.equal(r.tela,'documentos');assert.equal(r.linhas,nDocs);assert.deepEqual(linhasFolha(),[nDocs]);
  assert.equal(d.body.dataset.v278Folha,'documentos');V.limpar();assert.equal('v278Folha' in d.body.dataset,false);assert.equal(folha().innerHTML,'')});

await teste('SPED Fiscal e EFD Contribuições: cada tela exporta só a sua escrituração e continua aberta depois do download',async()=>{
  for(const [k,docs,curto] of [['spedfiscal',12,'SPED Fiscal'],['efdcontrib',7,'EFD Contribuições']]){
    await menu(k);assert.equal(d.getElementById('load').dataset.v263Modo,k);assert.equal(V.resolver('carga'),k);
    const pl=await excel(d.querySelector('[data-v278-excel="carga"]'));
    assert.deepEqual(pl.map(x=>x.nome+':'+x.linhas),['Documentos da escrituração:'+docs,'Itens da escrituração:'+docs]);
    /* antes da V278 o clique do link de download devolvia a tela para "Carregar XML/PDF" */
    await esperar(60);assert.equal(d.getElementById('load').dataset.v263Modo,k,'a tela deve continuar em '+curto);
    const r=V.preparar('carga');assert.equal(r.tela,k);assert.deepEqual(linhasFolha(),[docs,docs]);assert.match(texto(),new RegExp('^'+curto));
    assert.doesNotMatch(texto(),/NFSE7|NFE20000/);V.limpar()}});

await teste('NF-e e CT-e: os botões aparecem na lista de itens e levam todas as linhas, não só as 200 da tela',async()=>{
  for(const k of ['nfe','cte']){
    await menu(k);const x=d.querySelector('[data-v278-excel="itens"]'),p=d.querySelector('[data-v278-pdf="itens"]');assert.ok(x&&p,'botões em '+k);
    const pl=await excel(x);assert.equal(pl.length,1);assert.equal(pl[0].linhas,nItens);
    p.click();assert.equal(d.body.dataset.v278Folha,'itens');
    assert.ok(linhasFolha().every(n=>n===nItens),'cada parte da tabela traz todas as linhas');assert.ok(nItens>200);
    w.dispatchEvent(new w.Event('afterprint'))}
  assert.equal(impressoes,2)});

await teste('tabela larga é dividida em partes de até 12 colunas, repetindo as colunas que identificam a linha',()=>{
  const s=V.secoes('itens')[0],b=V.blocos(s);assert.ok(b.cols.length>12);assert.ok(b.partes.length>1);
  for(const p of b.partes){assert.ok(p.length<=12);assert.deepEqual(puro(p.slice(0,3)),['numero_documento','numero_item','codigo_item'])}
  assert.equal(new Set(b.partes.flat()).size,b.cols.length,'nenhuma coluna com valor fica de fora');
  V.preparar('itens');const caps=[...folha().querySelectorAll('caption')].map(c=>c.textContent);
  assert.match(caps[0],/^Parte 1 de \d+ — 12 de \d+ coluna\(s\)/);assert.equal(caps.length,b.partes.length);
  if(b.vazias)assert.match(caps[0],/sem nenhum valor não foram impressas \(a planilha Excel traz todas\)/);V.limpar()});

await teste('folha traz a empresa informada na primeira tela, o desenvolvedor e não interpreta HTML dos documentos',()=>{
  V.preparar('itens');const t=texto(),e=[...folha().querySelectorAll('.v278-emp b')].map(x=>x.textContent);
  assert.deepEqual(e,['CLIENTE TESTE LTDA','11.222.333/0001-81','Não informado']);
  assert.match(t,/Desenvolvedor — Carlos Bella · \+55 11 99479-7347/);assert.match(t,/Emitido em \d{2}\/\d{2}\/\d{4}/);
  assert.match(t,/PRODUTO <b>DE<\/b> TESTE 259/);assert.equal(folha().querySelectorAll('td b').length,0);V.limpar()});

await teste('NFS-e: botão de PDF ao lado do Excel, com todas as notas de serviço',async()=>{
  await menu('nfse');const p=d.querySelector('[data-v278-pdf="nfse"]');assert.ok(p);assert.equal(p.previousElementSibling.id,'expIssV89');
  const n=w.eval('linhasIss().length');assert.equal(n,30);
  const r=V.preparar('nfse');assert.equal(r.linhas,n);assert.ok(linhasFolha().every(x=>x===n));assert.match(texto(),/Consultoria 29/);V.limpar()});

await teste('Base de IBS/CBS: o Excel volta a trazer as linhas e o PDF passa das 200 linhas da tela',async()=>{
  await menu('ibs');const n=w.eval('cacheTabelas.ibscbs.rows.length');assert.ok(n>200);
  assert.equal(d.querySelectorAll('#ibsCbsTable tbody tr').length,200);
  const pl=await excel(d.querySelector('#ibscbs [data-exp="ibscbs"]'));assert.equal(pl[0].nome,'Base de IBS-CBS');assert.equal(pl[0].linhas,n);   /* o Excel não aceita / no nome da planilha */
  assert.match(pl[0].xml,/Validação NCM\/NBS/);assert.match(pl[0].xml,/cClassTrib adequada/);
  const antes=impressoes;d.querySelector('#ibscbs .v46-print').click();await esperar(80);
  assert.equal(impressoes,antes+1,'uma só impressão');assert.equal(d.body.dataset.v278Folha,'ibs');assert.deepEqual(linhasFolha(),[n]);
  w.dispatchEvent(new w.Event('afterprint'))});

await teste('Cálculo 2026 a 2033 por item: PDF com as mesmas planilhas do Excel',async()=>{
  await menu('calculoitem');const p=d.querySelector('[data-v278-pdf="calculoitem"]');assert.ok(p);assert.equal(p.previousElementSibling.id,'v277Exportar');
  const pl=await excel(d.getElementById('v277Exportar'));
  assert.deepEqual(pl.map(x=>x.nome),['Cálculo por item','Resumo por ano','Cronograma usado','Como é calculado']);
  const s=V.secoes('calculoitem');assert.deepEqual(puro(s.map(x=>x.titulo+':'+x.linhas.length)),pl.map(x=>x.nome+':'+x.linhas));
  assert.ok(s[0].linhas.length>200);
  V.preparar('calculoitem');const t=texto();for(const a of [2026,2027,2033])assert.ok(t.includes(String(a)));
  assert.equal(folha().querySelectorAll('section.v278-sec').length,4);V.limpar()});

await teste('Análise por NCM: PDF com a análise, o resumo por semáforo e a explicação',async()=>{
  await menu('ncmanalise');const p=d.querySelector('[data-v278-pdf="ncmanalise"]');assert.ok(p);assert.equal(p.previousElementSibling.id,'v253NcmExportar');
  const pl=await excel(d.getElementById('v253NcmExportar'));assert.deepEqual(pl.map(x=>x.nome),['Análise por NCM','Resumo por semáforo','Como ler o resumo']);
  const s=V.secoes('ncmanalise');assert.deepEqual(puro(s.map(x=>x.linhas.length)),pl.map(x=>x.linhas));
  V.preparar('ncmanalise');assert.deepEqual([...folha().querySelectorAll('.v278-sec h2')].map(h=>h.firstChild.textContent.trim()),pl.map(x=>x.nome));V.limpar()});

await teste('Fornecedores e clientes: PDF com a relação e a análise de crédito, valores com duas casas',async()=>{
  await menu('fornecedores');const p=d.querySelector('[data-v278-pdf="fornecedores"]');assert.ok(p);assert.equal(p.previousElementSibling.id,'v253FornExportar');
  const pl=await excel(d.getElementById('v253FornExportar'));assert.equal(pl[0].nome,'Fornecedores');
  const s=V.secoes('fornecedores');assert.equal(s[0].linhas.length,pl[0].linhas);assert.equal(s[1].titulo,'Crédito por fornecedor');
  assert.match(String(s[0].linhas[0].valor_total),/^\d{1,3}(\.\d{3})*,\d{2}$/);
  V.preparar('fornecedores');assert.match(texto(),/Crédito por fornecedor/);V.limpar()});

await teste('Cronograma de alíquotas: Excel e PDF com as alíquotas de 2026 a 2033',async()=>{
  await menu('crono');const x=d.querySelector('[data-v278-excel="crono"]'),p=d.querySelector('[data-v278-pdf="crono"]');assert.ok(x&&p);
  const pl=await excel(x);assert.equal(pl[0].nome,'Alíquotas por ano');assert.match(pl[0].xml,/Alíquota 2026/);assert.match(pl[0].xml,/Alíquota 2033/);
  const cbs=V.secoes('crono')[0].linhas.find(l=>/^CBS/.test(l.Tributo));assert.equal(cbs['Alíquota 2026'],'0,9%');
  for(let a=2027;a<=2033;a++)assert.equal(cbs['Alíquota '+a],'11,3%');
  assert.equal(V.telaAberta(),'crono');V.preparar('crono');assert.match(texto(),/^Cronograma de alíquotas por tributo/);V.limpar()});

await teste('Validação de atividades (CNAE): o Excel passa a trazer a validação de cada CNAE',async()=>{
  const c=d.getElementById('cnaesEmpresa');c.value='4639-7/01\n6920-6/01';c.dispatchEvent(new w.Event('input',{bubbles:true}));c.dispatchEvent(new w.Event('change',{bubbles:true}));
  await menu('cnae');assert.ok(d.getElementById('dashboard').classList.contains('v156-cnae-mode'));
  const pl=await excel(d.querySelector('#dashboard [data-exp="dashboard"]'));assert.equal(pl[0].nome,'Validação por CNAE');assert.equal(pl[0].linhas,2);
  assert.match(pl[0].xml,/4639-7\/01/);assert.match(pl[0].xml,/6920-6\/01/);assert.ok(d.querySelector('#dashboard .v46-print'))});

await teste('Consulta NCM e NBS: botão de Excel ao lado de "Imprimir em PDF", com o resultado da consulta',async()=>{
  await menu('consulta');const i=d.getElementById('v123-ncm');i.value='0202.30.00';d.querySelector('[data-v123-consulta="ncm"]').click();await esperar(200);V.instalar();
  const x=d.querySelector('#v153-result [data-v278-excel="consulta"]');assert.ok(x);assert.ok(x.nextElementSibling.classList.contains('v153-print'));
  const pl=await excel(x);assert.equal(pl[0].nome,'Resumo da consulta');assert.match(pl[0].xml,/0202\.30\.00/);assert.ok(pl.length>=2)});

await teste('filtro ativo na tela vale para o Excel e para o PDF',async()=>{
  await menu('nfe');w.eval('filtrosTabelas.table={numero_documento:["20003","20004"]};render()');
  const pl=await excel(d.querySelector('[data-v278-excel="itens"]'));assert.equal(pl[0].linhas,2);
  V.preparar('itens');assert.ok(linhasFolha().every(n=>n===2));assert.match(texto(),/2 linha\(s\)/);V.limpar();
  w.eval('filtrosTabelas.table={};render()')});

await teste('Ctrl+P monta a folha nas telas que saíam em branco ou cortadas e não interfere nas outras',async()=>{
  for(const [k,f] of [['documentos','documentos'],['nfe','itens'],['cte','itens'],['nfse','nfse'],['ibs','ibs'],['calculoitem','calculoitem'],['ncmanalise','ncmanalise'],['fornecedores','fornecedores'],['crono','crono']]){
    await menu(k);w.dispatchEvent(new w.Event('beforeprint'));assert.equal(d.body.dataset.v278Folha,f,'Ctrl+P em '+k);
    assert.equal(d.body.classList.contains('v46-imp'),false,'a preparação antiga não deve redesenhar a tela em '+k);
    w.dispatchEvent(new w.Event('afterprint'));assert.equal('v278Folha' in d.body.dataset,false)}
  for(const k of ['dashboard','enquadramento','apuracaocbs','cnae']){
    await menu(k);assert.equal(V.telaAberta(),'');w.dispatchEvent(new w.Event('beforeprint'));assert.equal('v278Folha' in d.body.dataset,false,'sem folha V278 em '+k);
    assert.equal(d.body.classList.contains('v46-imp'),true,'impressão própria mantida em '+k);w.dispatchEvent(new w.Event('afterprint'))}});

await teste('imprimir troca o título pelo nome do arquivo e devolve tudo depois',async()=>{
  await menu('nfse');const t=d.title,antes=impressoes;d.querySelector('[data-v278-pdf="nfse"]').click();
  assert.equal(impressoes,antes+1);assert.match(d.title,/^nfse_11222333000181_\d{4}-\d{2}-\d{2}$/);
  w.dispatchEvent(new w.Event('afterprint'));assert.equal(d.title,t);assert.equal(folha().innerHTML,'');assert.equal(d.getElementById('v278-pagina'),null)});

await teste('regras de impressão: A4 paisagem só durante a folha, o resto da página escondido e a Consulta sem 2ª página em branco',()=>{
  const css=d.getElementById('v278-style').textContent;
  assert.match(css,/@media print\{/);assert.match(css,/html body\[data-v278-folha\]>\*:not\(#v278-folha\)[^{]*\{display:none!important\}/);
  assert.match(css,/#v278-folha table\.v278-t thead\{display:table-header-group\}/);assert.match(css,/tr\{break-inside:avoid/);
  assert.match(css,/body\.v219-modo-consulta:not\(\[data-v278-folha\]\)[^{]*\{min-height:0!important/);
  assert.doesNotMatch(css,/@page/);V.preparar('nfse');assert.match(d.getElementById('v278-pagina').textContent,/@page\{size:A4 landscape;margin:8mm\}/);V.limpar();
  assert.match(css.split('@media print')[0],/#v278-folha\{display:none\}/)});

await teste('tela sem dados: avisa, não abre a impressão e não gera arquivo; os documentos carregados não são alterados',async()=>{
  const antesItens=JSON.stringify(w.eval('state.items.slice(0,'+nBase+')'));assert.equal(antesItens,JSON.stringify(base));
  w.eval('state.items=[];state.docs=[];state.errors=[];render()');await menu('documentos');
  avisos.length=0;blobs.length=0;const antes=impressoes;
  d.querySelector('[data-v278-excel="carga"]').click();d.querySelector('[data-v278-pdf="carga"]').click();
  assert.deepEqual(avisos,['Não há dados nesta tela para exportar.','Não há dados nesta tela para imprimir.']);assert.equal(blobs.length,0);assert.equal(impressoes,antes);
  assert.equal('v278Folha' in d.body.dataset,false);
  w.dispatchEvent(new w.Event('beforeprint'));assert.equal('v278Folha' in d.body.dataset,false);assert.equal(avisos.length,2,'Ctrl+P não mostra aviso');w.dispatchEvent(new w.Event('afterprint'))});

assert.deepEqual([...new Set(erros)],[],'erros de JavaScript na página');
console.log(ok+' testes V278 OK');w.close();process.exit(0);
