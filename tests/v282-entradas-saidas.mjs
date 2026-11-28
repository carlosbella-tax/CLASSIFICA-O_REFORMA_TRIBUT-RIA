/* V282 — Regressão: Cálculo 2026 a 2033 por item com os indicadores IBS + CBS em 2027, IBS + CBS em 2033 e
   Carga em 2033 × hoje separados em saídas e entradas, na tela, no Excel e no PDF. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const dom=new JSDOM('<html><head></head><body>'
  +'<aside id="v123-sidebar"><button class="v123-link" data-v123-key="ibs" data-v123-tab="ibscbs">Base de IBS/CBS</button><button class="v123-link" data-v123-key="enquadramento">Enquadramento</button><div class="v123-status"></div></aside>'
  +'<div id="v123-title">x</div><button class="tab" data-tab="load"></button><button class="tab" data-tab="items"></button><button class="tab" data-tab="icms"></button><button class="tab" data-tab="dashboard"></button><button class="tab" data-tab="observacoes"></button>'
  +'<section id="icms" class="panel"></section><section id="dashboard" class="panel"></section><section id="observacoes" class="panel"></section>'
  +'<input id="cnpjEmpresa" value="11.222.333/0001-81"><input id="anoPeriodo" value="2026"><input id="empresa" value="CLIENTE TESTE LTDA"><select id="regimeEmpresa"><option value="">Selecione</option><option value="Lucro Real">Lucro Real</option><option value="Lucro Presumido">Lucro Presumido</option><option value="Simples Nacional">Simples Nacional</option></select></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;
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
let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V282: '+nome)};
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
const n2=v=>Math.round(v*100)/100;

const regime=v=>{const e=d.getElementById('regimeEmpresa');e.value=v;e.dispatchEvent(new w.Event('change',{bubbles:true}))};
const abrir=()=>{d.querySelector('.tab[data-tab="calculo2033"]').click()};
const linhasTela=()=>[...d.querySelectorAll('#v277Tabela tbody tr.v277-linha')];
const set=(id,v)=>{const e=d.getElementById(id);e.value=v;e.dispatchEvent(new w.Event('input',{bubbles:true}))};

const real=v=>(v<0?'-':'')+'R$ '+new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Math.abs(v));
/* saída de mercadoria: o emitente é a empresa informada na primeira tela */
const saida=(ncm,o={})=>merc(ncm,{cfop:'5102',emitente_cnpj_cpf:'11222333000181',emitente_razao_social:'CLIENTE TESTE LTDA',destinatario_cnpj_cpf:'55666777000188',destinatario_razao_social:'COMPRADOR LTDA',...o});
const kpis=()=>[...d.querySelectorAll('#v277Kpis .v260-kpi')].map(k=>({rot:k.querySelector('label').textContent,total:k.querySelector('b').textContent,sub:k.querySelector('small').textContent,
  lados:[...k.querySelectorAll('.v282-lado')].map(x=>x.textContent.replace(/\s+/g,' ').trim())}));
const kpi=r=>kpis().find(k=>k.rot===r);

await teste('operação de cada item: saída quando o emitente é a empresa informada ou quando o documento foi marcado como saída',()=>{
  regime('Lucro Real');
  assert.equal(V.calcular(merc('84145990')).operacao,'Entrada');assert.equal(V.calcular(saida('84145990')).operacao,'Saída');assert.equal(V.calcular(nota()).operacao,'Saída');
  assert.equal(V.calcular(merc('84145990',{tipo_operacao:'SAÍDAS'})).operacao,'Saída');assert.equal(V.calcular(saida('84145990',{tipo_operacao:'ENTRADAS'})).operacao,'Entrada')});

await teste('totais por operação: saídas e entradas somam o total, ano a ano',()=>{
  const p=V.projetar([merc('84145990'),merc('48181000',doc('200','200035')),saida('84145990'),saida('84145990'),nota()]),T=V.totalizar(p),P=V.porOperacao(p);
  assert.equal(P.entrada.itens,2);assert.equal(P.saida.itens,3);assert.equal(P.entrada.valor,2000);assert.equal(P.saida.valor,3000);
  /* entradas: 84145990 (218,26 em 2033) + 48181000 com redução de 60% (87,30) */
  assert.equal(P.entrada.anos[7].ibscbs,305.56);assert.equal(P.entrada.anos[1].cbs,115.09);assert.equal(P.entrada.hoje,645);assert.equal(P.entrada.anos[7].diferenca,-339.44);
  /* saídas: duas mercadorias (218,26 cada) e uma nota de serviço */
  const serv=V.calcular(nota());assert.equal(P.saida.anos[7].ibscbs,n2(436.52+serv.anos[7].ibscbs));assert.equal(P.saida.hoje,n2(645+serv.hoje));
  for(let i=0;i<8;i++)for(const f of ['cbs','ibsE','ibsM','ibscbs','carga','diferenca'])assert.equal(n2(P.saida.anos[i][f]+P.entrada.anos[i][f]),T.anos[i][f],f+' '+T.anos[i].ano);
  for(const f of ['valor','hoje','base','icms','iss','ipi','pis','cofins'])assert.equal(n2(P.saida[f]+P.entrada[f]),T[f],f);
  assert.equal(P.saida.itens+P.entrada.itens,T.itens)});

await teste('itens fora do cálculo (CT-e) não entram em nenhum dos lados',()=>{
  const p=V.projetar([merc('84145990'),saida('84145990'),merc('84145990',{tipo_documento:'CT-e'}),saida('84145990',{tipo_documento:'CT-e'})]),P=V.porOperacao(p);
  assert.equal(P.entrada.itens,1);assert.equal(P.saida.itens,1);assert.equal(P.entrada.fora.itens,1);assert.equal(P.saida.fora.itens,1);assert.equal(P.entrada.anos[7].ibscbs,218.26);assert.equal(P.saida.anos[7].ibscbs,218.26)});

/* ---------- tela ---------- */
let P0,T0;
await teste('tela: os três indicadores mostram Saídas e Entradas, com o total em destaque',()=>{
  regime('Lucro Real');w.state.items=[merc('84145990'),merc('48181000',doc('200','200035')),saida('84145990'),saida('84145990'),nota()];w.state.docs=[1,2,3,4,5];w.state.runId++;abrir();
  const p=V.projetar(w.state.items);T0=V.totalizar(p);P0=V.porOperacao(p);
  const a=kpi('IBS + CBS em 2027'),b=kpi('IBS + CBS em 2033'),c=kpi('Carga em 2033 × hoje');
  assert.equal(a.total,real(T0.anos[1].ibscbs));assert.equal(a.lados.length,2);
  assert.equal(a.lados[0],'Saídas'+real(P0.saida.anos[1].ibscbs)+'CBS '+real(P0.saida.anos[1].cbs)+' · IBS '+real(n2(P0.saida.anos[1].ibsE+P0.saida.anos[1].ibsM)));
  assert.equal(a.lados[1],'Entradas'+real(P0.entrada.anos[1].ibscbs)+'CBS R$ 115,09 · IBS '+real(n2(P0.entrada.anos[1].ibsE+P0.entrada.anos[1].ibsM)));
  assert.equal(b.total,real(T0.anos[7].ibscbs));assert.match(b.lados[1],/^EntradasR\$ 305,56CBS R\$ 115,09 · IBS R\$ 190,47$/);assert.match(b.lados[0],/^SaídasR\$ [\d.]+,\d{2}CBS R\$ [\d.]+,\d{2} · IBS R\$ [\d.]+,\d{2}$/);
  assert.equal(c.total,real(T0.anos[7].diferenca));assert.equal(c.lados[1],'Entradas-R$ 339,4452,63% a menos que os R$ 645,00 de hoje');
  assert.match(c.lados[0],/^Saídas-?R\$ [\d.]+,\d{2}\d+,\d{2}% a (mais|menos) que os R\$ [\d.]+,\d{2} de hoje$/)});

await teste('os demais indicadores não ganham a separação e os totais continuam os mesmos',()=>{
  for(const r of ['Itens no cálculo','Valor dos itens','Tributos de hoje','Novo valor dos itens (base de IBS e CBS)','Itens com redução de alíquota'])assert.equal(kpi(r).lados.length,0,r);
  assert.equal(kpi('Itens no cálculo').total,'5');assert.equal(kpi('Valor dos itens').total,'R$ 5.000,00');assert.equal(kpis().length,8);
  assert.equal(kpi('IBS + CBS em 2033').sub,'CBS '+real(T0.anos[7].cbs)+' · IBS '+real(n2(T0.anos[7].ibsE+T0.anos[7].ibsM)))});

await teste('filtro Operação: só o lado escolhido tem valores; o outro informa que não há itens na seleção',()=>{
  set('v277Operacao','Saída');let b=kpi('IBS + CBS em 2033');assert.equal(b.total,real(P0.saida.anos[7].ibscbs));assert.match(b.lados[0],/^SaídasR\$/);assert.equal(b.lados[1],'Entradassem itens na seleção');
  set('v277Operacao','Entrada');b=kpi('IBS + CBS em 2033');assert.equal(b.total,'R$ 305,56');assert.equal(b.lados[0],'Saídassem itens na seleção');assert.equal(b.lados[1],'EntradasR$ 305,56CBS R$ 115,09 · IBS R$ 190,47');
  assert.equal(d.getElementById('v282Aviso').hidden,true,'com o filtro em Entradas não há aviso');set('v277Operacao','')});

await teste('visão por código: o mesmo código com entrada e saída continua separado nos indicadores',()=>{
  set('v277Visao','codigo');const l=linhasTela().find(x=>/8414\.59\.90/.test(x.textContent));assert.match(l.textContent,/Entrada e saída/);
  const b=kpi('IBS + CBS em 2033');assert.equal(b.lados[1],'EntradasR$ 305,56CBS R$ 115,09 · IBS R$ 190,47');assert.ok(b.lados[0].startsWith('Saídas'+real(P0.saida.anos[7].ibscbs)));
  set('v277Visao','item')});

await teste('busca e demais filtros valem para os dois lados',()=>{
  set('v277Busca','8414');const b=kpi('IBS + CBS em 2033');assert.equal(b.total,'R$ 654,78');assert.equal(b.lados[0],'SaídasR$ 436,52CBS R$ 164,42 · IBS R$ 272,10');assert.equal(b.lados[1],'EntradasR$ 218,26CBS R$ 82,21 · IBS R$ 136,05');
  const c=kpi('Carga em 2033 × hoje');assert.equal(c.total,'-R$ 312,72');assert.equal(c.lados[0],'Saídas-R$ 208,4832,32% a menos que os R$ 645,00 de hoje');assert.equal(c.lados[1],'Entradas-R$ 104,2432,32% a menos que os R$ 322,50 de hoje');
  set('v277Busca','')});

await teste('Excel e PDF: planilha Entradas e saídas por ano, com os oito anos e o total de cada um',()=>{
  w.__xlsx.length=0;d.getElementById('v277Exportar').click();const x=w.__xlsx[0];
  assert.deepEqual(puro(x.abas.map(a=>a[0])),['Cálculo por item','Resumo por ano','Entradas e saídas por ano','Cronograma usado','Como é calculado']);
  const l=puro(x.abas[2][1]);assert.equal(l.length,24);
  assert.deepEqual(Object.keys(l[0]),['Ano','Operação','Itens','Valor dos itens','Tributos de hoje','CBS','IBS estadual','IBS municipal','IBS + CBS','Carga do ano','Diferença contra hoje','Variação']);
  assert.deepEqual(l.slice(0,3).map(r=>r['Ano']+' '+r['Operação']),['2026 Saídas','2026 Entradas','2026 Total']);
  const de=(a,o)=>l.find(r=>r['Ano']===a&&r['Operação']===o);
  assert.equal(de('2033','Entradas')['IBS + CBS'],'305,56');assert.equal(de('2033','Entradas')['Diferença contra hoje'],'-339,44');assert.equal(de('2033','Entradas')['Variação'],'-52,63%');assert.equal(de('2033','Entradas')['Itens'],2);
  assert.equal(de('2027','Entradas')['CBS'],'115,09');assert.equal(de('2033','Saídas')['Itens'],3);assert.equal(de('2033','Total')['Itens'],5);assert.equal(de('2033','Total')['Valor dos itens'],'5.000,00');
  const nu=s=>Number(String(s).replace(/\./g,'').replace(',','.'));
  for(const a of ['2026','2027','2029','2033'])for(const c of ['CBS','IBS estadual','IBS municipal','IBS + CBS','Carga do ano','Diferença contra hoje'])assert.equal(n2(nu(de(a,'Saídas')[c])+nu(de(a,'Entradas')[c])),nu(de(a,'Total')[c]),a+' '+c);
  /* o total da planilha é o mesmo do Resumo por ano */
  const res=puro(x.abas[1][1]);assert.equal(de('2033','Total')['IBS + CBS'],res[7]['IBS + CBS']);assert.equal(de('2033','Total')['Carga do ano'],res[7]['Carga do ano']);
  const como=x.abas[4][1].map(r=>r.explicacao).join(' | ');assert.match(como,/mostram cada parte em separado/);assert.match(como,/Saída é o item em que o emitente do documento é a empresa informada na primeira tela/);
  assert.deepEqual(puro(V.planilhas().map(a=>a[0])),puro(x.abas.map(a=>a[0])))});

await teste('sem nenhuma saída reconhecida a tela avisa; sem o CNPJ da empresa, explica o motivo',()=>{
  const av=d.getElementById('v282Aviso');assert.equal(av.hidden,true);
  w.state.items=[merc('84145990'),merc('48181000',doc('200','200035'))];w.state.runId++;abrir();
  assert.equal(av.hidden,false);assert.match(av.textContent,/Nenhum item foi reconhecido como saída/);assert.equal(kpi('IBS + CBS em 2033').lados[0],'Saídassem itens na seleção');
  const c=d.getElementById('cnpjEmpresa'),antes=c.value;c.value='';w.state.items=[merc('84145990'),saida('84145990')];w.state.runId++;abrir();
  assert.equal(av.hidden,false);assert.match(av.textContent,/CNPJ da empresa não informado na primeira tela/);
  c.value=antes;w.state.runId++;abrir();assert.equal(av.hidden,true);assert.equal(av.textContent,'')});

await teste('sem documentos: indicadores e aviso ficam ocultos; os itens dos documentos não são alterados',()=>{
  const it=[merc('84145990'),saida('84145990'),nota()],antes=JSON.stringify(it);V.porOperacao(V.projetar(it));assert.equal(JSON.stringify(it),antes);
  w.state.items=[];w.state.docs=[];w.state.runId++;abrir();assert.equal(d.getElementById('v277Kpis').hidden,true);assert.equal(d.getElementById('v282Aviso').hidden,true);assert.deepEqual(puro(V.planilhas()),[])});

await teste('build com a versão e a separação por operação',()=>{
  const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);assert.ok(dist.includes('v282-lado'));assert.ok(dist.includes('Entradas e saídas por ano'))});
console.log(ok+' testes V282 OK');w.close();process.exit(0);
