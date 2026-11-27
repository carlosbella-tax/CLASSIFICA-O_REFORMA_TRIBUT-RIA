/* V277 — Regressão: tela "Cálculo 2026 a 2033 por item" (tributos de hoje, base de IBS/CBS e projeção por ano,
   conforme CST e cClassTrib), menu depois de Base de IBS/CBS, resumo por ano, filtros, detalhe e exportação. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const dom=new JSDOM('<html><head></head><body>'
  +'<aside id="v123-sidebar"><button class="v123-link" data-v123-key="ibs" data-v123-tab="ibscbs">Base de IBS/CBS</button><button class="v123-link" data-v123-key="enquadramento">Enquadramento</button><div class="v123-status"></div></aside>'
  +'<div id="v123-title">x</div><button class="tab" data-tab="load"></button><button class="tab" data-tab="items"></button><button class="tab" data-tab="icms"></button><button class="tab" data-tab="dashboard"></button><button class="tab" data-tab="observacoes"></button>'
  +'<section id="icms" class="panel"></section><section id="dashboard" class="panel"></section><section id="observacoes" class="panel"></section>'
  +'<input id="cnpjEmpresa" value="11.222.333/0001-81"><input id="anoPeriodo" value="2026"><input id="empresa" value="CLIENTE TESTE LTDA"><select id="regimeEmpresa"><option></option></select></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;
w.structuredClone=structuredClone;w.alert=()=>{};
w.eval('var state={files:[],items:[],events:[],docs:[],errors:[],runId:0};'
 +'function $(id){return document.getElementById(id)}function esc(v){return String(v??"").replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\'":"&#39;",\'"\':"&quot;"}[c]))}'
 +'function num(v){if(typeof v==="number")return v;let x=String(v??"").trim().replace(/[^0-9,.-]/g,"");if(x.includes(","))x=x.replace(/\\./g,"").replace(",",".");const n=Number(x);return Number.isFinite(n)?n:0}'
 +'var tipoOperacao=r=>{if(r&&r.tipo_operacao)return String(r.tipo_operacao).toUpperCase().startsWith("SA")?"SAÍDAS":"ENTRADAS";const d=v=>String(v||"").replace(/\\D/g,"");return d(r&&r.emitente_cnpj_cpf)===d($("cnpjEmpresa").value)?"SAÍDAS":"ENTRADAS"};'
 +'const __FMT_BRL=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});function brl(v){return __FMT_BRL.format(Number(v||0))}'
 +'function brNumero(v,casas=2){return new Intl.NumberFormat("pt-BR",{minimumFractionDigits:casas,maximumFractionDigits:casas}).format(Number(v||0))}'
 +'function valorGrupo(row,grupo,tag){return Object.entries(row||{}).filter(([k])=>k.toUpperCase().includes("_"+grupo.toUpperCase())&&k.toUpperCase().endsWith("_"+tag.toUpperCase())).reduce((a,[,v])=>a+num(v),0)}'
 +'function valorIcms(row,tag){return Object.entries(row||{}).filter(([k])=>{const u=k.toUpperCase();return u.includes("_ICMS")&&u.endsWith("_"+tag.toUpperCase())&&!u.includes("ST")}).reduce((a,[,v])=>a+num(v),0)}'
 +'function taxPick(row,grupo,sufixo){const k=Object.keys(row||{}).find(x=>x.toUpperCase().includes("_"+grupo.toUpperCase())&&x.toUpperCase().endsWith(sufixo.toUpperCase()));return k?row[k]:""}'
 +'function campoGrupo(row,grupo,sufixo){const g=grupo.toUpperCase(),t=sufixo.toUpperCase(),alias=g==="CBS"?["_CBS","_IBSCBS"]:g==="IBS"?["_IBS","_IBSCBS"]:["_"+g];const x=Object.entries(row||{}).find(([k])=>{const u=k.toUpperCase();return alias.some(a=>u.includes(a))&&u.endsWith("_"+t)});return x?x[1]:""}'
 +'window.renderAba=()=>{};window.atualizarBadgesTributos=()=>{};window.__xlsx=[];function gerarXlsx(nome,abas){window.__xlsx.push({nome,abas})}');
/* relação de NCM: a mesma base da TIPI - Base Completa usada pelos testes da V273 */
const l39=fs.readFileSync(path.join(root,'src/js/modulos/09-v39-base-ibs-cbs-validada.js'),'utf8').split('\n')[4];w.__REF39=JSON.parse(l39.slice(l39.indexOf('{'),l39.lastIndexOf('}')+1));
w.eval('window.classificadorReferenciaNcm=function(c){const n=String(c||"").replace(/\\D/g,""),R=window.__REF39,t=R.tipi[n],u=R.u;if(n==="48181000")return {codigo:n,descricao:"- Papel higiênico",anexo:"Anexo VIII (produtos de higiene pessoal e limpeza)",cclasstrib:"200035",cst:"200",observacao:""};return {codigo:n,descricao:t?t[0]:"NCM não encontrada na TIPI - Base Completa",anexo:t?u[t[1]]:"",cclasstrib:t?u[t[2]]:"",cst:t?u[t[3]]:"",observacao:t?u[t[4]]:""}};');
for(const f of ['dados/portal-conformidade-cst-cclasstrib-2026.js','dados/it-2025-002-cclasstrib.js','dados/anexo-viii-correlacao-nbs.js','modulos/102-v168-cronograma-editavel-regime.js','modulos/122-v248-nbs-correlacao-nfse.js','modulos/123-v251-nfse-enquadramento-servico.js','modulos/103-v180-enquadramento-recomendado-item.js','modulos/104-v181-cfop-credito-debito-ibs-cbs.js','modulos/124-v252-aliquotas-anexos-legais.js','modulos/125-v253-painel-fornecedores-impacto.js','modulos/142-v273-validacao-ncm-nbs.js','modulos/143-v277-calculo-2026-2033-por-item.js'])
  w.eval(fs.readFileSync(path.join(root,'src/js',f),'utf8'));
let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V277: '+nome)};
const V=w.classificadorV277,d=w.document,S=V.SITUACAO;
let seq=0;
const merc=(ncm,o={})=>({arquivo_origem:'a.xml',tipo_documento:'NF-e/NFC-e',modelo:'55',chave_documento:'CH'+(++seq),numero_documento:String(100+seq),numero_item:1,data_emissao:'2026-11-05',cfop:'1102',
  emitente_cnpj_cpf:'12345678000255',emitente_razao_social:'FORNECEDOR ALFA LTDA',destinatario_cnpj_cpf:'11222333000181',destinatario_razao_social:'CLIENTE TESTE LTDA',ncm,descricao_item:'Mercadoria '+ncm,
  valor_item:'1000,00',item_ICMS_vICMS:'180,00',item_PIS_vPIS:'20,00',item_COFINS_vCOFINS:'100,00',item_IPI_vIPI:'50,00',...o});
const doc=(cst,cc)=>({item_det_imposto_IBSCBS_CST:cst,item_det_imposto_IBSCBS_cClassTrib:cc});
const nota=(o={})=>({arquivo_origem:'n.xml',tipo_documento:'NFS-e',chave_documento:'NS'+(++seq),numero_documento:String(900+seq),numero_item:1,data_emissao:'2026-11-06',emitente_cnpj_cpf:'11222333000181',emitente_razao_social:'CLIENTE TESTE LTDA',
  destinatario_cnpj_cpf:'99888777000166',destinatario_razao_social:'TOMADOR LTDA',codigo_item:'17.01',descricao_item:'Assessoria',valor_item:1000,dados_nfse:{codigo_servico:'17.01',nbs:'1.1401.11.00',descricao_servico:'Assessoria',valor_servico:1000,valor_iss:50,aliquota_iss:5},...o});
const ano=(c,a)=>c.anos[a-2026];
const puro=x=>JSON.parse(JSON.stringify(x));

await teste('menu: item novo logo depois de Base de IBS/CBS, com contador, aba e tela próprias',()=>{
  const b=d.querySelector('#v123-sidebar [data-v123-key="calculoitem"]');assert.ok(b);assert.equal(b.previousElementSibling.dataset.v123Key,'ibs');assert.equal(b.dataset.v123Tab,'calculo2033');
  assert.match(b.textContent,/^Cálculo 2026 a 2033 por item/);assert.ok(d.getElementById('calculo2033'));assert.ok(d.querySelector('.tab[data-tab="calculo2033"]'));assert.equal(w.V277_CARREGADO,true)});
await teste('base de IBS/CBS = valor do item − ICMS − PIS − COFINS; o IPI não entra na base',()=>{
  const c=V.calcular(merc('84145990'));assert.equal(c.valor,1000);assert.equal(c.icms,180);assert.equal(c.pis,20);assert.equal(c.cofins,100);assert.equal(c.ipi,50);assert.equal(c.iss,0);
  assert.equal(c.hoje,350);assert.equal(c.base,700);assert.equal(c.rotulo,'NCM 8414.59.90');assert.equal(c.operacao,'Entrada')});
await teste('tributação integral (000/000001): CBS, IBS estadual e IBS municipal de cada ano pelo cronograma',()=>{
  const c=V.calcular(merc('84145990'));assert.equal(c.cst,'000');assert.equal(c.cc,'000001');assert.equal(c.descCst,'Tributação integral');assert.equal(c.situacao,S.CALC);assert.equal(c.origem,'Relação de NCM (TIPI)');
  const q=a=>[ano(c,a).cbs,ano(c,a).ibsE,ano(c,a).ibsM,ano(c,a).ibscbs];
  assert.deepEqual(q(2026),[6.3,0.7,0,7]);assert.deepEqual(q(2027),[79.1,0.35,0.35,79.8]);assert.deepEqual(q(2029),[79.1,11.2,1.75,92.05]);assert.deepEqual(q(2033),[79.1,113.4,17.5,210]);
  assert.deepEqual(puro(c.anos.map(a=>a.ano)),[2026,2027,2028,2029,2030,2031,2032,2033])});
await teste('PIS e COFINS extintos em 2027, IPI zerado em 2027, ICMS reduzido de 2029 a 2032 e extinto em 2033',()=>{
  const c=V.calcular(merc('84145990')),col=k=>puro(c.anos.map(a=>a[k]));
  assert.deepEqual(col('pis'),[20,0,0,0,0,0,0,0]);assert.deepEqual(col('cofins'),[100,0,0,0,0,0,0,0]);assert.deepEqual(col('ipi'),[50,0,0,0,0,0,0,0]);assert.deepEqual(col('icms'),[180,180,180,162,144,126,108,0])});
await teste('carga do ano e diferença contra hoje; em 2026 o IBS e a CBS de teste não somam',()=>{
  const c=V.calcular(merc('84145990'));assert.equal(ano(c,2026).carga,350);assert.equal(ano(c,2026).diferenca,0);
  assert.equal(ano(c,2027).carga,259.8);assert.equal(ano(c,2027).diferenca,-90.2);assert.equal(ano(c,2029).carga,254.05);assert.equal(ano(c,2033).carga,210);assert.equal(ano(c,2033).diferenca,-140)});
await teste('cClassTrib válido do documento define a redução: 200035 reduz 60% de IBS e CBS',()=>{
  const c=V.calcular(merc('48181000',doc('200','200035')));assert.equal(c.origem,'Documento');assert.equal(c.cst,'200');assert.equal(c.cc,'200035');assert.equal(c.redIbs,60);assert.equal(c.redCbs,60);assert.equal(c.situacao,S.CALC);
  assert.equal(c.descCst,'Alíquota reduzida em 60%');assert.equal(ano(c,2027).cbs,31.64);assert.equal(ano(c,2033).ibscbs,84);assert.ok(Math.abs(ano(c,2033).aliqCbs-4.52)<1e-9)});
await teste('sem CST no documento, o enquadramento vem da relação de NCM, com a redução dela',()=>{
  const c=V.calcular(merc('48181000'));assert.equal(c.origem,'Relação de NCM (TIPI)');assert.equal(c.cc,'200035');assert.equal(c.redIbs,60);assert.equal(ano(c,2033).ibscbs,84)});
await teste('imunidade no documento (410008): sem IBS e CBS em todos os anos, situação SEM IBS/CBS',()=>{
  const c=V.calcular(merc('49011000',{...doc('410','410008'),item_ICMS_vICMS:'',item_PIS_vPIS:'',item_COFINS_vCOFINS:'',item_IPI_vIPI:''}));
  assert.equal(c.situacao,S.SEM);assert.equal(c.semAliquota,true);assert.equal(c.base,1000);assert.ok(c.anos.every(a=>a.ibscbs===0&&a.carga===0));assert.match(c.obs,/sem IBS e CBS/)});
await teste('mais de uma hipótese de cClassTrib na relação: calcula sem redução e marca CONFERIR com o motivo',()=>{
  const c=V.calcular(merc('30012010'));assert.equal(c.situacao,S.CONF);assert.equal(c.redIbs,0);assert.equal(c.cst,'200');assert.match(c.cc,/200009 \/ 200010/);assert.match(c.obs,/Mais de uma hipótese de cClassTrib.*calculado sem redução/);assert.equal(ano(c,2033).ibscbs,210)});
await teste('enquadramento em revisão: mostra os códigos da relação, calcula sem redução e marca CONFERIR',()=>{
  const c=V.calcular(merc('10011100'));assert.equal(c.situacao,S.CONF);assert.equal(c.cc,'200003');assert.equal(c.cst,'200');assert.equal(c.redIbs,0);assert.match(c.obs,/Enquadramento em revisão \(a relação lista 200003\); calculado sem redução/);assert.equal(ano(c,2033).ibscbs,210)});
await teste('cClassTrib único da relação sem redução confirmada: calcula sem redução e informa a redução da tabela',()=>{
  const c=V.calcular(merc('20011000'));assert.equal(c.situacao,S.CONF);assert.equal(c.cc,'200034');assert.equal(c.redIbs,0);assert.match(c.obs,/cClassTrib 200034 \(redução de 60,00% na tabela\) indicado pela relação, sem confirmação/);assert.equal(ano(c,2033).ibscbs,210)});
await teste('cClassTrib de alíquota própria (fixa ou uniforme) não é calculado e fica fora dos totais',()=>{
  const it=w.IT_2025_002.classes;let achou=null;
  for(const cc of Object.keys(it)){if(/^Padr|^Sem al/i.test(it[cc].tipoAliq))continue;const c=V.calcular(merc('84145990',doc(it[cc].cst,cc)));if(c.situacao===S.NAO){achou=c;break}}
  assert.ok(achou,'nenhum cClassTrib de alíquota própria aceito');assert.equal(achou.calculado,false);assert.match(achou.obs,/alíquota própria/);assert.equal(achou.base,700);
  const T=V.totalizar([achou,V.calcular(merc('84145990'))]);assert.equal(T.itens,1);assert.equal(T.fora.itens,1);assert.equal(T.fora.valor,1000);assert.equal(T.anos[7].ibscbs,210)});
await teste('CT-e fica fora do cálculo e dos totais, com o motivo na observação',()=>{
  const c=V.calcular({tipo_documento:'CT-e',modelo:'57',chave_documento:'CT1',numero_documento:'55',numero_item:1,descricao_item:'Documento vinculado ao CT-e',valor_item:'50000.00',emitente_cnpj_cpf:'12345678000255'});
  assert.equal(c.situacao,S.NAO);assert.equal(c.calculado,false);assert.match(c.obs,/CT-e: a linha é o documento transportado \(valor da carga\), não o frete/);
  const T=V.totalizar([c]);assert.equal(T.itens,0);assert.equal(T.fora.itens,1);assert.equal(T.anos[7].ibscbs,0);assert.equal(T.valor,0)});
await teste('NCM em revisão com redução informada no documento: calcula com a redução do documento e marca CONFERIR',()=>{
  w.V254_DIVERGENCIAS_MOTOR_NCM={'07095100':{}};const c=V.calcular(merc('07095100',doc('200','200014')));delete w.V254_DIVERGENCIAS_MOTOR_NCM;
  assert.equal(c.origem,'Documento');assert.equal(c.situacao,S.CONF);assert.equal(c.redIbs,100);assert.equal(ano(c,2033).ibscbs,0);assert.match(c.obs,/em revisão.*Calculado com a redução informada no documento\./)});
await teste('cClassTrib do documento que precisa de ajuste não é usado: projeção pela relação, com aviso',()=>{
  const c=V.calcular(merc('84145990',doc('200','999999')));assert.equal(c.origem,'Relação de NCM (TIPI)');assert.equal(c.cc,'000001');assert.match(c.obs,/Documento informa CST 200 e cClassTrib 999999, que precisa de ajuste/)});
await teste('serviço (NBS): a base desconta o ISS; ISS reduzido de 2029 a 2032 e extinto em 2033; saída da empresa',()=>{
  const c=V.calcular(nota());assert.equal(c.tipo,'NBS');assert.equal(c.rotulo,'NBS 1.1401.11.00');assert.equal(c.servico,'17.01');assert.equal(c.iss,50);assert.equal(c.icms,0);assert.equal(c.pis,0);
  assert.equal(c.base,950);assert.equal(c.hoje,50);assert.equal(c.operacao,'Saída');assert.equal(c.origem,'Relação de NBS e serviços');
  assert.deepEqual(puro(c.anos.map(a=>a.iss)),[50,50,50,45,40,35,30,0]);assert.equal(ano(c,2033).ibscbs,285);assert.equal(ano(c,2033).diferenca,235)});
await teste('item sem NCM e sem NBS é calculado com tributação integral e marcado CONFERIR',()=>{
  const c=V.calcular(merc(''));assert.equal(c.tipo,'');assert.equal(c.situacao,S.CONF);assert.match(c.obs,/sem NCM de 8 dígitos/);assert.equal(ano(c,2033).ibscbs,210)});
await teste('usa o cronograma editado na tela de alíquotas (CBS de 2027 alterada)',()=>{
  w.localStorage.setItem('classificador.v168.cronograma',JSON.stringify({anos:[2026,2027,2028,2029,2030,2031,2032,2033],tabela:{'CBS (%)':[0.9,10,11.3,11.3,11.3,11.3,11.3,11.3]}}));
  const c=V.calcular(merc('84145990'));assert.equal(ano(c,2027).cbs,70);assert.equal(ano(c,2028).cbs,79.1);assert.equal(ano(c,2027).ibsE,0.35);
  w.localStorage.removeItem('classificador.v168.cronograma');assert.equal(ano(V.calcular(merc('84145990')),2027).cbs,79.1)});
await teste('o cálculo não altera os itens dos documentos',()=>{
  const itens=[merc('84145990'),merc('48181000',doc('200','200035')),nota()],antes=JSON.stringify(itens);V.projetar(itens);assert.equal(JSON.stringify(itens),antes)});
await teste('visão por código soma os itens iguais; totais por ano batem com a soma dos itens',()=>{
  const p=V.projetar([merc('84145990'),merc('84145990'),merc('48181000',doc('200','200035')),nota()]),g=V.agrupar(p);
  assert.equal(g.length,3);const a=g.find(x=>x.codigo==='84145990');assert.equal(a.itens,2);assert.equal(a.documentos,2);assert.equal(a.valor,2000);assert.equal(a.base,1400);assert.equal(a.anos[7].ibscbs,420);
  const T=V.totalizar(p),T2=V.totalizar(g);assert.equal(T.itens,4);assert.equal(T.codigos,3);assert.equal(T.valor,4000);assert.equal(T.base,3050);assert.equal(T.hoje,1100);
  assert.equal(T.anos[7].ibscbs,789);assert.equal(T.anos[7].carga,789);assert.equal(T.anos[7].diferenca,-311);assert.deepEqual(puro(T2.anos),puro(T.anos))});

/* ---------- tela ---------- */
const abrir=()=>{d.querySelector('.tab[data-tab="calculo2033"]').click()};
const linhasTela=()=>[...d.querySelectorAll('#v277Tabela tbody tr.v277-linha')];
const set=(id,v)=>{const e=d.getElementById(id);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}))};
await teste('tela vazia orienta a processar arquivos e esconde indicadores e resumo',()=>{
  w.state.items=[];abrir();assert.ok(d.getElementById('calculo2033').classList.contains('active'));assert.match(d.querySelector('#v277Tabela tbody').textContent,/Processe arquivos/);
  assert.equal(d.getElementById('v277Kpis').hidden,true);assert.equal(d.getElementById('v277ResumoCard').hidden,true)});
await teste('tela com carga: título, contador, colunas de hoje, base e 2026 a 2033, valores em R$ com duas casas',()=>{
  w.state.items=[merc('84145990'),merc('48181000',doc('200','200035')),merc('30012010'),nota()];w.state.docs=[1,2,3,4];w.state.runId++;abrir();
  assert.equal(d.getElementById('v123-title').textContent,'Cálculo 2026 a 2033 por item — Documentos: 4 · itens: 4 · todos os itens dos XMLs, em páginas.');
  assert.equal(d.querySelector('[data-v123-count="calculoitem"]').textContent,'4');
  const th=[...d.querySelectorAll('#v277Tabela thead th')].map(x=>x.textContent);
  for(const t of ['Código','CST','Descrição do CST','cClassTrib','Redução IBS/CBS','Valor do item','ICMS hoje','ISS hoje','IPI hoje','PIS hoje','COFINS hoje','Tributos hoje','Base IBS/CBS','IBS+CBS 2026 (teste)','IBS+CBS 2027','IBS+CBS 2033','Carga em 2033','Diferença 2033 × hoje','Situação','Observação'])assert.ok(th.includes(t),t);
  const tr=linhasTela();assert.equal(tr.length,4);const c=[...tr[0].cells].map(x=>x.textContent),v=t=>c[th.indexOf(t)];
  assert.equal(v('Base IBS/CBS'),'R$ 700,00');assert.equal(v('IBS+CBS 2027'),'R$ 79,80');assert.equal(v('IBS+CBS 2033'),'R$ 210,00');assert.equal(v('Diferença 2033 × hoje'),'-R$ 140,00');
  assert.equal(v('Tributos hoje'),'R$ 350,00');assert.equal(v('Situação'),'CALCULADO')});
await teste('indicadores e resumo por ano somam os itens exibidos',()=>{
  const k=d.getElementById('v277Kpis').textContent;assert.match(k,/Base de IBS e CBS\s*R\$ 3\.050,00/);assert.match(k,/IBS \+ CBS em 2033\s*R\$ 789,00/);
  const r=[...d.querySelectorAll('#v277ResumoTabela tbody tr')].map(t=>[...t.cells].map(x=>x.textContent));assert.equal(r.length,8);
  assert.deepEqual(r.map(x=>x[0]),['2026','2027','2028','2029','2030','2031','2032','2033']);
  assert.equal(r[0][1],'R$ 360,00');assert.equal(r[1][1],'R$ 0,00');assert.equal(r[1][2],'R$ 0,00');assert.equal(r[7][3],'R$ 0,00');assert.equal(r[7][7],'R$ 789,00');assert.equal(r[0][9],'R$ 0,00');
  assert.match(r[1][11],/PIS e COFINS extintos/);assert.match(r[7][11],/ICMS e ISS extintos/)});
await teste('clicar na linha abre o cálculo ano a ano com alíquotas e a conta da base; clicar de novo fecha',()=>{
  linhasTela()[1].click();const det=d.querySelector('#v277Tabela .v277-det');assert.ok(det);const t=det.textContent.replace(/\s+/g,' ');
  assert.match(t,/Base de IBS e CBS = valor do item R\$ 1\.000,00 − ICMS R\$ 180,00 − ISS R\$ 0,00 − PIS R\$ 20,00 − COFINS R\$ 100,00 = R\$ 700,00/);assert.match(t,/CST 200 — Alíquota reduzida em 60% · cClassTrib 200035 · 60,00% · origem: Documento/);
  const l=[...det.querySelectorAll('.v277-ano tbody tr')];assert.equal(l.length,8);assert.equal(l[7].cells[1].textContent,'4,52%');assert.equal(l[7].cells[3].textContent,'6,48%');assert.equal(l[7].cells[5].textContent,'1,00%');assert.equal(l[7].cells[7].textContent,'R$ 84,00');
  linhasTela()[1].click();assert.equal(d.querySelector('#v277Tabela .v277-det'),null)});
await teste('filtros: operação, tipo, situação, pesquisa e visão por código',()=>{
  set('v277Operacao','Saída');assert.equal(linhasTela().length,1);set('v277Operacao','');
  set('v277Tipo','NCM');assert.equal(linhasTela().length,3);set('v277Tipo','SERV');assert.equal(linhasTela().length,1);set('v277Tipo','');
  set('v277Situacao','CONFERIR');assert.equal(linhasTela().length,1);assert.match(linhasTela()[0].textContent,/3001\.20\.10/);set('v277Situacao','');
  set('v277Busca','4818');assert.equal(linhasTela().length,1);set('v277Busca','200035');assert.equal(linhasTela().length,1);set('v277Busca','');
  w.state.items.push(merc('84145990'));w.state.runId++;abrir();set('v277Visao','codigo');assert.equal(linhasTela().length,4);
  assert.equal(d.querySelector('#v277Tabela thead th').textContent,'Código');const a=linhasTela().find(t=>/8414\.59\.90/.test(t.textContent));assert.equal(a.cells[1].textContent,'2');
  assert.match(d.getElementById('v277Info').textContent,/Códigos: 4.*itens somados: 5/);set('v277Visao','item');assert.equal(linhasTela().length,5)});
await teste('ordem por maior aumento em 2033 põe primeiro o item que mais sobe; por maior redução, o que mais cai',()=>{
  set('v277Ordem','aumento');assert.match(linhasTela()[0].textContent,/NBS 1\.1401\.11\.00/);set('v277Ordem','reducao');assert.match(linhasTela()[0].textContent,/4818\.10\.00/);set('v277Ordem','')});
await teste('exportação: planilhas do cálculo, resumo por ano, cronograma usado e como é calculado, em 0.000,00',()=>{
  w.__xlsx.length=0;d.getElementById('v277Exportar').click();assert.equal(w.__xlsx.length,1);const x=w.__xlsx[0];assert.match(x.nome,/^CALCULO_2026_2033_POR_ITEM_\d{4}-\d{2}-\d{2}\.xlsx$/);
  assert.deepEqual(puro(x.abas.map(a=>a[0])),['Cálculo por item','Resumo por ano','Cronograma usado','Como é calculado']);
  const l=x.abas[0][1][0];assert.equal(l['Base IBS/CBS'],'700,00');assert.equal(l['Valor do item'],'1.000,00');assert.equal(l['CBS 2027'],'79,10');assert.equal(l['IBS estadual 2033'],'113,40');assert.equal(l['IBS municipal 2033'],'17,50');
  assert.equal(l['IBS+CBS 2033'],'210,00');assert.equal(l['Carga 2033'],'210,00');assert.equal(l['Diferença 2033 × hoje'],'-140,00');assert.equal(l['cClassTrib'],'000001');assert.equal(l['Descrição do CST'],'Tributação integral');
  assert.equal(x.abas[1][1].length,8);assert.equal(x.abas[2][1][1]['CBS'],'11,30%');assert.equal(x.abas[2][1][7]['IBS estadual'],'16,20%');assert.equal(x.abas[2][1][3]['Redução do ICMS e do ISS'],'10,00%');
  assert.ok(x.abas[3][1].some(r=>/valor do item − ICMS − ISS − PIS − COFINS/i.test(r.explicacao)))});
await teste('paginação: 100 itens por página, com Anterior e Próxima',()=>{
  w.state.items=Array.from({length:230},()=>merc('84145990'));w.state.runId++;abrir();assert.equal(linhasTela().length,100);assert.match(d.getElementById('v277Pag').textContent,/Página 1 de 3/);
  d.querySelector('[data-v277-pag="1"]').click();d.querySelector('[data-v277-pag="1"]').click();assert.equal(linhasTela().length,30);assert.match(d.getElementById('v277Pag').textContent,/Página 3 de 3/);
  assert.equal(d.querySelector('[data-v277-pag="1"]').disabled,true);assert.match(d.getElementById('v277Info').textContent,/Itens: 230 · exibindo 201 a 230/)});
await teste('explicação traz a regra da base, a extinção de PIS e COFINS e os avisos de interpretação',()=>{
  const t=d.getElementById('v277Como').textContent;assert.match(t,/Valor do item − ICMS − ISS − PIS − COFINS/);assert.match(t,/Extintos em 2027/);assert.match(t,/reduzidos em 2029 \(10,00%\), 2030 \(20,00%\), 2031 \(30,00%\), 2032 \(40,00%\) e extintos em 2033/);
  assert.match(t,/Não desconta os créditos de IBS e CBS/);assert.match(t,/ICMS-ST, DIFAL, frete, seguro, descontos e Imposto Seletivo não entram/)});
console.log(ok+' testes V277 OK');w.close();process.exit(0);
