/* V279 — Regressão: Cálculo 2026 a 2033 por item com PIS e COFINS pelo regime tributário informado
   (Lucro Real 1,65% e 7,60%; Lucro Presumido 0,65% e 3,00%), novo valor do item como base de IBS e CBS,
   e itens com redução de alíquota (indicador, filtro, colunas e detalhe). */
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
let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V279: '+nome)};
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

await teste('alíquotas de PIS e COFINS por regime: Lucro Real 1,65% e 7,60%; Lucro Presumido 0,65% e 3,00%',()=>{
  assert.deepEqual(puro(V.REGIMES),{'Lucro Real':{pis:1.65,cofins:7.6},'Lucro Presumido':{pis:0.65,cofins:3}});
  const r=V.regime('Lucro Real'),p=V.regime('Lucro Presumido'),s=V.regime('Simples Nacional'),n=V.regime('');
  assert.equal(r.aplica,true);assert.equal(r.pis,1.65);assert.equal(r.cofins,7.6);assert.match(r.texto,/Lucro Real: PIS de 1,65% e COFINS de 7,60%/);
  assert.equal(p.aplica,true);assert.equal(p.pis,0.65);assert.equal(p.cofins,3);assert.match(p.texto,/Lucro Presumido: PIS de 0,65% e COFINS de 3,00%/);
  assert.equal(s.aplica,false);assert.match(s.texto,/Simples Nacional: sem alíquota própria/);assert.equal(n.aplica,false);assert.match(n.texto,/não informado/)});

await teste('sem regime informado valem o PIS e a COFINS destacados no documento (cálculo da V277 preservado)',()=>{
  regime('');const c=V.calcular(merc('84145990'));assert.equal(c.pis,20);assert.equal(c.cofins,100);assert.equal(c.base,700);assert.equal(c.pisCofinsRegime,false);
  assert.equal(c.pisDoc,20);assert.equal(c.cofinsDoc,100);assert.equal(ano(c,2033).ibscbs,210)});

await teste('Lucro Real: novo valor do item = valor − ICMS − PIS 1,65% − COFINS 7,60%, e IBS/CBS calculados sobre ele',()=>{
  regime('Lucro Real');const c=V.calcular(merc('84145990'));
  assert.equal(c.pis,16.5);assert.equal(c.cofins,76);assert.equal(c.icms,180);assert.equal(c.base,727.5);assert.equal(c.hoje,322.5);assert.equal(c.pisCofinsRegime,true);
  assert.equal(c.pisDoc,20);assert.equal(c.cofinsDoc,100);   /* o destacado no documento continua disponível para comparação */
  assert.equal(ano(c,2026).pis,16.5);assert.equal(ano(c,2026).cofins,76);assert.equal(ano(c,2027).pis,0);assert.equal(ano(c,2027).cofins,0);
  assert.equal(ano(c,2027).cbs,82.21);assert.equal(ano(c,2033).cbs,82.21);assert.equal(ano(c,2033).ibsE,117.86);assert.equal(ano(c,2033).ibsM,18.19);assert.equal(ano(c,2033).ibscbs,218.26)});

await teste('Lucro Presumido: novo valor do item = valor − ICMS − PIS 0,65% − COFINS 3,00%',()=>{
  regime('Lucro Presumido');const c=V.calcular(merc('84145990'));
  assert.equal(c.pis,6.5);assert.equal(c.cofins,30);assert.equal(c.base,783.5);assert.equal(c.hoje,266.5);
  assert.equal(ano(c,2027).cbs,88.54);assert.equal(ano(c,2033).ibscbs,235.06)});

await teste('serviço (NBS): o ISS ocupa o lugar do ICMS e o PIS e a COFINS do regime entram mesmo sem destaque na nota',()=>{
  regime('Lucro Presumido');const c=V.calcular(nota());
  assert.equal(c.tipo,'NBS');assert.equal(c.iss,50);assert.equal(c.icms,0);assert.equal(c.pisDoc,0);assert.equal(c.cofinsDoc,0);
  assert.equal(c.pis,6.5);assert.equal(c.cofins,30);assert.equal(c.base,913.5);
  regime('Lucro Real');const r=V.calcular(nota());assert.equal(r.pis,16.5);assert.equal(r.cofins,76);assert.equal(r.base,857.5)});

await teste('Simples Nacional: não há alíquota própria; valem os valores do documento',()=>{
  regime('Simples Nacional');const c=V.calcular(merc('84145990'));assert.equal(c.pis,20);assert.equal(c.cofins,100);assert.equal(c.base,700);assert.equal(c.pisCofinsRegime,false)});

await teste('item com redução de alíquota: marcado, calculado com a redução sobre o novo valor e com a economia de 2033',()=>{
  regime('Lucro Real');const c=V.calcular(merc('48181000',doc('200','200035')));
  assert.equal(c.reducao,'COM');assert.equal(c.redIbs,60);assert.equal(c.redCbs,60);assert.equal(c.base,727.5);assert.equal(c.possivel,0);
  assert.equal(ano(c,2033).ibscbs,87.3);assert.equal(c.economia33,130.95);assert.match(c.hipotese,/higiene pessoal e limpeza \(Anexo VIII\)/);
  const i=V.calcular(merc('84145990'));assert.equal(i.reducao,'SEM');assert.equal(i.economia33,0);assert.equal(i.possivel,0);
  assert.equal(n2(ano(i,2033).ibscbs-ano(c,2033).ibscbs),130.96)});

await teste('redução a conferir: mostra o maior percentual das hipóteses, mas calcula sem redução até confirmar',()=>{
  const c=V.calcular(merc('30012010'));assert.equal(c.situacao,S.CONF);assert.equal(c.reducao,'POSSIVEL');assert.ok(c.possivel>0);
  assert.equal(c.redIbs,0);assert.equal(c.redCbs,0);assert.equal(c.economia33,0);assert.equal(ano(c,2033).ibscbs,218.26)});

await teste('sem IBS/CBS e CT-e não entram como redução de alíquota',()=>{
  const z=V.calcular(merc('84145990',doc('410','410001')));assert.equal(z.situacao,S.SEM);assert.equal(z.reducao,'SEM_ALIQ');assert.equal(ano(z,2033).ibscbs,0);
  const t=V.calcular(merc('84145990',{tipo_documento:'CT-e'}));assert.equal(t.calculado,false);assert.equal(t.reducao,'NAO')});

await teste('totais: itens com redução, valor, economia de 2033 e itens com redução a conferir',()=>{
  regime('Lucro Real');const p=V.projetar([merc('84145990'),merc('48181000',doc('200','200035')),merc('48181000',doc('200','200035')),merc('30012010'),nota()]),T=V.totalizar(p);
  assert.equal(T.red.itens,2);assert.equal(T.red.valor,2000);assert.equal(T.red.economia,261.9);assert.equal(T.conferir.itens,1);assert.equal(T.conferir.valor,1000);
  assert.equal(T.pis,82.5);assert.equal(T.cofins,380);assert.equal(T.pisDoc,80);assert.equal(T.cofinsDoc,400);assert.equal(T.base,3767.5);
  const g=V.agrupar(p),a=g.find(x=>x.codigo==='48181000');assert.equal(a.itens,2);assert.equal(a.economia33,261.9);assert.equal(a.reducao,'COM');assert.deepEqual(puro(V.totalizar(g).red),puro(T.red))});

await teste('o cálculo pelo regime não altera os itens dos documentos',()=>{
  const it=[merc('84145990'),nota()],antes=JSON.stringify(it);regime('Lucro Real');V.projetar(it);regime('Lucro Presumido');V.projetar(it);assert.equal(JSON.stringify(it),antes)});

/* ---------- tela ---------- */
await teste('tela: faixa informa o regime usado e a coluna passa a se chamar Novo valor do item (base IBS/CBS)',()=>{
  regime('Lucro Real');w.state.items=[merc('84145990'),merc('48181000',doc('200','200035')),merc('30012010'),nota()];w.state.docs=[1,2,3,4];w.state.runId++;abrir();
  const f=d.getElementById('v279Regime');assert.match(f.textContent,/^PIS e COFINS — Lucro Real: PIS de 1,65% e COFINS de 7,60% calculados sobre o valor do item\.$/);assert.equal(f.classList.contains('alerta'),false);
  const th=[...d.querySelectorAll('#v277Tabela thead th')].map(x=>x.textContent);assert.ok(th.includes('Novo valor do item (base IBS/CBS)'));assert.equal(th.includes('Base IBS/CBS'),false);
  const c=[...linhasTela()[0].cells].map(x=>x.textContent),v=t=>c[th.indexOf(t)];
  assert.equal(v('PIS hoje'),'R$ 16,50');assert.equal(v('COFINS hoje'),'R$ 76,00');assert.equal(v('Novo valor do item (base IBS/CBS)'),'R$ 727,50');assert.equal(v('IBS+CBS 2033'),'R$ 218,26');assert.equal(v('Redução IBS/CBS'),'Sem redução');
  const r=[...linhasTela()[1].cells].map(x=>x.textContent);assert.equal(r[th.indexOf('Redução IBS/CBS')],'60,00%');assert.equal(r[th.indexOf('IBS+CBS 2033')],'R$ 87,30');
  assert.match([...linhasTela()[2].cells][th.indexOf('Redução IBS/CBS')].textContent,/^A conferir \(até \d+,\d{2}%\)$/)});

await teste('trocar o regime na primeira tela recalcula a tela aberta; sem regime a faixa avisa',()=>{
  regime('Lucro Presumido');const th=[...d.querySelectorAll('#v277Tabela thead th')].map(x=>x.textContent),v=t=>linhasTela()[0].cells[th.indexOf(t)].textContent;
  assert.equal(v('PIS hoje'),'R$ 6,50');assert.equal(v('COFINS hoje'),'R$ 30,00');assert.equal(v('Novo valor do item (base IBS/CBS)'),'R$ 783,50');
  assert.match(d.getElementById('v279Regime').textContent,/Lucro Presumido: PIS de 0,65% e COFINS de 3,00%/);
  regime('');assert.equal(v('PIS hoje'),'R$ 20,00');assert.equal(v('Novo valor do item (base IBS/CBS)'),'R$ 700,00');
  const f=d.getElementById('v279Regime');assert.match(f.textContent,/Regime tributário não informado.*Informe Lucro Real ou Lucro Presumido na primeira tela/);assert.equal(f.classList.contains('alerta'),true);
  regime('Lucro Real')});

await teste('indicador e filtro de redução de alíquota',()=>{
  const k=d.getElementById('v277Kpis').textContent.replace(/\s+/g,' ');
  assert.match(k,/Itens com redução de alíquota\s*1\s*R\$ 1\.000,00 em itens · IBS \+ CBS de 2033 R\$ 130,95 menor · 1 item\(ns\) com redução a conferir/);
  assert.match(k,/Novo valor dos itens \(base de IBS e CBS\)\s*R\$ 3\.040,00/);
  const op=[...d.getElementById('v279Reducao').options].map(o=>o.value+':'+o.textContent);
  assert.deepEqual(op,[':Redução de alíquota: todos','COM:Com redução de alíquota','POSSIVEL:Redução a conferir','SEM:Sem redução (tributação integral)','SEM_ALIQ:Sem IBS/CBS']);
  set('v279Reducao','COM');assert.equal(linhasTela().length,1);assert.match(linhasTela()[0].textContent,/4818\.10\.00/);
  set('v279Reducao','POSSIVEL');assert.equal(linhasTela().length,1);assert.match(linhasTela()[0].textContent,/3001\.20\.10/);
  set('v279Reducao','SEM');assert.equal(linhasTela().length,2);set('v279Reducao','SEM_ALIQ');assert.equal(linhasTela().length,0);set('v279Reducao','');assert.equal(linhasTela().length,4)});

await teste('detalhe do item: conta do novo valor, PIS e COFINS do regime e do documento, hipótese e economia da redução',()=>{
  linhasTela()[1].click();const t=d.querySelector('#v277Tabela .v277-det').textContent.replace(/\s+/g,' ');
  assert.match(t,/Novo valor do item \(base de IBS e CBS\) = valor do item R\$ 1\.000,00 − ICMS R\$ 180,00 − ISS R\$ 0,00 − PIS R\$ 16,50 − COFINS R\$ 76,00 = R\$ 727,50/);
  assert.match(t,/PIS e COFINS: Lucro Real: PIS de 1,65% e COFINS de 7,60% calculados sobre o valor do item\. No documento: PIS R\$ 20,00 e COFINS R\$ 100,00\./);
  assert.match(t,/Hipótese do cClassTrib: Fornecimento dos produtos de higiene pessoal e limpeza \(Anexo VIII\)/);
  assert.match(t,/Redução de alíquota: aplicada; em 2033 o IBS \+ CBS deste item fica R\$ 130,95 menor do que sem a redução\./);
  linhasTela()[1].click();linhasTela()[2].click();
  assert.match(d.querySelector('#v277Tabela .v277-det').textContent,/Redução de alíquota: a conferir, até \d+,\d{2}% entre as hipóteses listadas; calculado sem redução/);linhasTela()[2].click()});

await teste('exportação (Excel e PDF usam as mesmas planilhas): colunas do regime e da redução, em 0.000,00',()=>{
  w.__xlsx.length=0;d.getElementById('v277Exportar').click();const x=w.__xlsx[0],l=x.abas[0][1];
  assert.deepEqual(puro(x.abas.map(a=>a[0])),['Cálculo por item','Resumo por ano','Entradas e saídas por ano','Cronograma usado','Como é calculado']);
  assert.equal(l[0]['PIS hoje'],'16,50');assert.equal(l[0]['COFINS hoje'],'76,00');assert.equal(l[0]['PIS no documento'],'20,00');assert.equal(l[0]['COFINS no documento'],'100,00');
  assert.equal(l[0]['Novo valor do item (base IBS/CBS)'],'727,50');assert.equal(l[0]['Redução de alíquota'],'Não');assert.equal('Base IBS/CBS' in l[0],false);
  assert.equal(l[1]['Redução de alíquota'],'Sim');assert.equal(l[1]['Redução IBS (%)'],'60,00');assert.equal(l[1]['Redução CBS (%)'],'60,00');assert.equal(l[1]['IBS+CBS 2033'],'87,30');
  assert.match(l[1]['Hipótese do cClassTrib'],/Anexo VIII/);assert.equal(l[2]['Redução de alíquota'],'A conferir');assert.match(l[2]['Redução a conferir (até %)'],/^\d+,\d{2}$/);
  const como=x.abas[4][1].map(r=>r.assunto+': '+r.explicacao).join(' | ');
  assert.match(como,/PIS e COFINS do regime: Lucro Real: PIS de 1,65% e COFINS de 7,60%/);assert.match(como,/Novo valor do item: Valor do item − ICMS − ISS − PIS − COFINS/);
  assert.match(como,/Redução de alíquota: Cada NCM ou NBS é consultado/);assert.match(como,/aplicados sobre o valor cheio de cada item, inclusive nas compras/);
  assert.deepEqual(puro(V.planilhas().map(a=>a[0])),puro(x.abas.map(a=>a[0])))});

await teste('visão por código soma os itens e mantém a marcação de redução',()=>{
  w.state.items.push(merc('48181000',doc('200','200035')));w.state.runId++;abrir();set('v277Visao','codigo');set('v279Reducao','COM');
  assert.equal(linhasTela().length,1);assert.equal(linhasTela()[0].cells[1].textContent,'2');
  assert.match(d.getElementById('v277Kpis').textContent.replace(/\s+/g,' '),/Itens com redução de alíquota\s*2\s*R\$ 2\.000,00 em itens · IBS \+ CBS de 2033 R\$ 261,90 menor/);
  set('v279Reducao','');set('v277Visao','item')});
console.log(ok+' testes V279 OK');w.close();process.exit(0);
