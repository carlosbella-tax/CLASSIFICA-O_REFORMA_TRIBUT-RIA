/* V256 — Regressão da apuração assistida da CBS: apuração prévia por PA e documento, leitura e validação
   dos JSON no padrão da Receita Federal (exemplos da documentação oficial, versão 1.3) e conciliação. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const dom=new JSDOM('<html><head></head><body><aside id="v123-sidebar"><button class="v123-link" data-v123-key="ibs"></button></aside><div id="v123-title"></div>'
 +'<button class="tab" data-tab="icms"></button><section id="icms" class="panel"></section></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;
w.alert=()=>{};
w.eval('var state={items:[]};function num(v){let x=String(v??"").trim().replace(/[^0-9,.-]/g,"");if(x.includes(","))x=x.replace(/\\./g,"").replace(",",".");const n=Number(x);return Number.isFinite(n)?n:0}'
 +'function valorGrupo(row,grupo,tag){return Object.entries(row||{}).filter(([k])=>k.toUpperCase().includes("_"+grupo.toUpperCase())&&k.toUpperCase().endsWith("_"+tag.toUpperCase())).reduce((a,[,v])=>a+num(v),0)}'
 +'var tipoOperacao=r=>r.tipo_operacao;window.renderAba=()=>{};window.__xlsx=null;window.gerarXlsx=(n,s)=>{window.__xlsx={n,s}};'
 +'window.v253TaxasAno=(i,red)=>({cbs:(i===0?0.9:11.3)*(red==null?1:1-red/100),ibsE:0,ibsM:0});window.v253Efeito=(t,c)=>({ref:{reducao:c==="02023000"?60:null},revisao:c==="30021211"});');
w.eval(fs.readFileSync(path.join(root,'src/js/modulos/128-v256-apuracao-assistida-cbs.js'),'utf8'));
const A=w.classificadorV256;let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V256: '+nome)};
const ch=(n,mod='55')=>'3526081234567800019'+'9'+mod+'001'+String(n).padStart(9,'0')+'1'+'00010001'+'1';
const item=(o)=>({tipo_documento:'NF-e/NFC-e',data_emissao:'2026-08-10',valor_item:1000,ncm:'84713000',emitente_razao_social:'FORNECEDOR',destinatario_razao_social:'CLIENTE',...o});
const itens=[
 item({tipo_operacao:'SAÍDAS',chave_documento:ch(1),numero_documento:'1',item_IBS_vBC:1000,item_CBS_vCBS:'9,00'}),
 item({tipo_operacao:'SAÍDAS',chave_documento:ch(1),numero_documento:'1',item_IBS_vBC:2000,item_CBS_vCBS:'18,00',valor_item:2000}),
 item({tipo_operacao:'SAÍDAS',chave_documento:ch(2),numero_documento:'2',item_CBS_vCBS:40}),
 item({tipo_operacao:'ENTRADAS',chave_documento:ch(3),numero_documento:'3',item_CBS_vCBS:3002}),
 item({tipo_operacao:'ENTRADAS',chave_documento:ch(4),numero_documento:'4',ncm:'02023000'}),
 item({tipo_operacao:'ENTRADAS',chave_documento:ch(5),numero_documento:'5',data_emissao:'2027-01-15'}),
 item({tipo_operacao:'ENTRADAS',chave_documento:'',numero_documento:'6',ncm:'30021211',data_emissao:'10/09/2026'})];
const base=(extra)=>({tiqueteSolicitacao:'48d88a3c-eff9-4489-8e3a-cde8d878d3f7.1E0CE7A4',ni:'12345678',niConsumidor:'12345678000195',geradoEm:'2026-08-19T21:08:32Z',...extra});
const reg=(chave,cbs,o={})=>({origem:0,documento:55,chave,emissao:'2026-08-10T04:53:58Z',registro:'2026-08-13T21:19:16.190202Z',atualizacao:'2026-08-13T21:19:16.190202Z',cbs,...o});
const debitos=base({apuracao:[{pa:'08/2026',debitos:[reg(ch(1),{apurado:27,extinto:7,saldoDevedor:20}),reg(ch(2),{excedente:10,apurado:70,inexigivel:5,suspenso:15,extinto:10,saldoDevedor:40}),reg(ch(99),{apurado:12.5,saldoDevedor:12.5})]}]});
const creditos=base({apuracao:[{pa:'08/2026',creditos:[reg(ch(3),{apurado:3002,apropriacao:{aApropriar:262.43,apropriado:2739.57,utilizacao:{utilizado:2739.57,naoUtilizado:{saldoCredor:0}}}}),
 reg(ch(3),{apurado:-100,apropriacao:{utilizacao:{naoUtilizado:{saldoCredor:0}}}},{origem:22})]}]});
const pagamentos=base({apuracao:[{dataArrecadacao:'2026-08-27',pagamentos:[
 {numeroDARF:'20260827000000001',tipo:1,niAdquirente:'98765432000123',composicao:[{sequencial:1,pa:'08/2026',vencimento:'2026-09-20',niContribuinte:'12345678000195',chaveDFE:ch(1),principal:100,multa:2,juros:1,total:103}]},
 {numeroDARF:'20260827000000002',tipo:2,niContribuinte:'12345678000195',composicao:[{sequencial:1,pa:'08/2026',vencimento:'2026-09-20',principal:80,multa:0.5,juros:1.25,total:81.75}]}]}]});
const recolhimentos=base({apuracao:[{dataArrecadacao:'2026-08-27',pagamentos:[{numeroDARF:'20260827000000003',tipo:1,composicao:[{sequencial:1,pa:'08/2026',vencimento:'2026-09-20',niFornecedor:'98765432000199',chaveDFE:ch(3),principal:100,multa:10,juros:5,total:115}]}]}]});
const linha=(co,c,lado)=>co.linhas.find(l=>l.chave===c&&(!lado||l.lado===lado));

await teste('apuração prévia: agrupa itens por documento e separa débitos (saídas) de créditos (entradas)',()=>{const ap=A.previa(itens);assert.equal(ap.documentos.length,6);
 const d1=ap.documentos.find(d=>d.chave===ch(1));assert.equal(d1.lado,'debitos');assert.equal(d1.itens,2);assert.equal(d1.cbsDestacada,27);assert.equal(d1.base,3000);assert.equal(d1.fonte,'Destacada no documento');assert.equal(d1.documento,55);
 assert.equal(ap.documentos.find(d=>d.chave===ch(3)).lado,'creditos')});
await teste('período de apuração no formato MM/AAAA a partir da emissão (ISO e dd/mm/aaaa), em ordem',()=>{const ap=A.previa(itens);assert.deepEqual([...ap.periodos].map(p=>p.pa),['08/2026','09/2026','01/2027'])});
await teste('totais do PA: débitos − créditos = saldo prévio, com duas casas',()=>{const p=A.previa(itens).periodos[0];assert.equal(p.debitos,67);assert.equal(p.docsDebito,2);assert.equal(p.creditos,3005.6);assert.equal(p.creditosDestacados,3002);assert.equal(p.saldo,-2938.6)});
await teste('sem CBS destacada: estimativa pelo cronograma do ano, com redução, identificada como estimativa',()=>{const ap=A.previa(itens);
 const d4=ap.documentos.find(d=>d.chave===ch(4));assert.equal(d4.cbsDestacada,0);assert.equal(d4.cbsEstimada,3.6);assert.equal(d4.fonte,'Estimada pelo cronograma');
 assert.equal(ap.documentos.find(d=>d.chave===ch(5)).cbsEstimada,113)});
await teste('pendências: documento sem chave e enquadramento em revisão ficam sinalizados',()=>{const d=A.previa(itens).documentos.find(x=>x.numero==='6');assert.equal(d.chaveValida,false);assert.match(d.pendencias.join(';'),/Sem chave de acesso/);assert.match(d.pendencias.join(';'),/Enquadramento em revisão/)});
await teste('reconhece os quatro arquivos de retorno e o retorno sem registros',()=>{assert.equal(A.tipoArquivo(debitos),'debitos');assert.equal(A.tipoArquivo(creditos),'creditos');assert.equal(A.tipoArquivo(pagamentos),'pagamentos');assert.equal(A.tipoArquivo(recolhimentos),'recolhimentos');assert.equal(A.tipoArquivo(base({apuracao:[]})),'vazio');assert.equal(A.tipoArquivo({x:1}),'')});
await teste('exemplos oficiais passam na validação de estrutura',()=>{for(const [j,t] of [[debitos,'debitos'],[creditos,'creditos'],[pagamentos,'pagamentos'],[recolhimentos,'recolhimentos']])assert.deepEqual([...A.validar(j,t)],[],t)});
await teste('recusa arquivo fora do padrão e informa o campo',()=>{const ruim=structuredClone(debitos);ruim.ni='123';ruim.apuracao[0].pa='2026-08';ruim.apuracao[0].debitos[0].origem=99;delete ruim.apuracao[0].debitos[1].cbs.saldoDevedor;
 const er=[...A.validar(ruim,'debitos')].join(' ');assert.match(er,/ni deve ter o CNPJ base de 8 dígitos/);assert.match(er,/pa fora do padrão MM\/AAAA/);assert.match(er,/origem inválida/);assert.match(er,/saldoDevedor ausente/);
 A.limpar();const r=A.importar(JSON.stringify(ruim),'ruim.json');assert.ok(r.erros.length);assert.equal(r.registros,0);assert.equal(A.estado.receita.debitos.size,0);
 assert.match(A.importar('{não é json','x.json').erros[0],/JSON válido/);assert.match(A.importar('{"a":1}','y.json').erros[0],/Estrutura não reconhecida/)});
await teste('conciliação de débitos: confere, valor diferente, só na Receita',()=>{A.limpar();assert.equal(A.importar(JSON.stringify(debitos),'debitos.json').registros,3);const co=A.conciliar(A.previa(itens));
 const l1=linha(co,ch(1));assert.equal(l1.situacao,'Confere');assert.equal(l1.cbsReceita,27);assert.equal(l1.diferenca,0);assert.equal(l1.extinto,7);assert.equal(l1.saldo,20);
 const l2=linha(co,ch(2));assert.equal(l2.situacao,'Valor diferente');assert.equal(l2.diferenca,-30);assert.equal(l2.suspenso,15);assert.equal(l2.excedente,10);
 const l9=linha(co,ch(99));assert.equal(l9.situacao,'Só na Receita');assert.equal(l9.cbsArquivos,null);assert.equal(l9.cbsReceita,12.5)});
await teste('sem JSON de créditos, os documentos de entrada aguardam a Receita',()=>{const co=A.conciliar(A.previa(itens));assert.equal(linha(co,ch(3)).situacao,'Aguardando JSON da Receita')});
await teste('conciliação de créditos: origem NORMAL compara; outras origens viram ajustes identificados',()=>{A.importar(JSON.stringify(creditos),'creditos.json');const co=A.conciliar(A.previa(itens));
 const l3=linha(co,ch(3),'creditos');assert.equal(l3.situacao,'Confere');assert.equal(l3.cbsReceita,3002);assert.equal(l3.ajustes,-100);assert.equal(l3.origens,'DEVOLUCAO_POR_CREDITO');assert.equal(l3.extinto,2739.57);
 assert.equal(linha(co,ch(4),'creditos').situacao,'Só nos arquivos');assert.equal(co.resumo['Confere'].qtd,2)});
await teste('arquivo incremental: prevalece a atualização mais recente e não duplica',()=>{const novo=structuredClone(debitos);novo.apuracao[0].debitos=[reg(ch(2),{apurado:40,saldoDevedor:40},{atualizacao:'2026-08-20T10:00:00Z'})];
 A.importar(JSON.stringify(novo),'debitos-2.json');assert.equal(A.estado.receita.debitos.size,3);assert.equal(linha(A.conciliar(A.previa(itens)),ch(2)).situacao,'Confere');
 const velho=structuredClone(novo);velho.apuracao[0].debitos[0].atualizacao='2026-08-01T10:00:00Z';velho.apuracao[0].debitos[0].cbs.apurado=1;A.importar(JSON.stringify(velho),'debitos-0.json');
 assert.equal(linha(A.conciliar(A.previa(itens)),ch(2)).cbsReceita,40)});
await teste('pagamentos e recolhimentos: totais por PA e natureza (PCONT, RAD dos adquirentes, RAD como adquirente)',()=>{A.importar(JSON.stringify(pagamentos),'pagamentos.json');A.importar(JSON.stringify(recolhimentos),'recolhimentos.json');A.importar(JSON.stringify(pagamentos),'pagamentos-de-novo.json');
 const p=A.conciliar(A.previa(itens)).pagamentos;assert.equal(p.length,3);assert.equal(p.find(x=>/PCONT/.test(x.natureza)).total,81.75);assert.equal(p.find(x=>/pelos adquirentes/.test(x.natureza)).total,103);assert.equal(p.find(x=>/como adquirente/.test(x.natureza)).total,115)});
await teste('tela: aba, menu, tabelas em R$ com duas casas, filtro de situação e exportação',()=>{w.state.items=itens;const d=w.document;assert.ok(d.getElementById('apuracaocbs'));assert.ok(d.querySelector('[data-v123-key="apuracaocbs"]'));
 d.querySelector('.tab[data-tab="apuracaocbs"]').click();assert.equal(d.getElementById('v123-title').textContent,'Apuração assistida da CBS');
 assert.equal(d.querySelectorAll('#v256PeriodosTable tbody tr').length,3);assert.match(d.getElementById('v256Periodos').textContent,/R\$ 3\.005,60/);assert.match(d.getElementById('v256Periodos').textContent,/Saldo credor/);
 assert.equal(d.querySelectorAll('#v256Table tbody tr').length,7);assert.match(d.getElementById('v256Resumo').textContent,/Confere: 3/);
 const f=d.getElementById('v256Filtro');f.value='Só na Receita';f.dispatchEvent(new w.Event('input'));assert.equal(d.querySelectorAll('#v256Table tbody tr').length,1);
 A.importar('{}','vazio.json');A.render(); assert.match(d.getElementById('v256Arquivos').textContent,/Recusado/);assert.match(d.getElementById('v256Arquivos').textContent,/Estrutura válida/);
 d.getElementById('v256Exportar').click();assert.match(w.__xlsx.n,/^APURACAO_ASSISTIDA_CBS_/);assert.deepEqual([...w.__xlsx.s].map(x=>x[0]),['Apuração prévia por PA','Conciliação','Documentos','Pagamentos']);
 d.getElementById('v256Limpar').click();assert.equal(A.estado.arquivos.length,0);assert.match(d.getElementById('v256Resumo').textContent,/importe os JSON da Receita/)});
await teste('privacidade: o módulo não faz chamadas de rede nem grava os JSON',()=>{const src=fs.readFileSync(path.join(root,'src/js/modulos/128-v256-apuracao-assistida-cbs.js'),'utf8');assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|localStorage|sessionStorage|sendBeacon|api\.receitafederal/)});
await teste('build: selo, título e módulos V256, V255 e V254 presentes',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO 256/);assert.match(dist,/<title>Auditoria Reforma Tributária — V256<\/title>/);for(const m of ['V256_CARREGADO','V255_CARREGADO','V254_CARREGADO'])assert.ok(dist.includes(m),m)});
w.close();console.log(`${ok} testes focados V256 OK`);process.exit(0);
