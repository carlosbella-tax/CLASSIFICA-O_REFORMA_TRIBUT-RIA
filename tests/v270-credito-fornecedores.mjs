/* V270 — Regressão: análise de crédito de IBS e CBS por fornecedor (melhores, impacto negativo e a analisar). */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/140-v270-analise-credito-fornecedores.js'),'utf8');
const m125=fs.readFileSync(path.join(root,'src/js/modulos/125-v253-painel-fornecedores-impacto.js'),'utf8');
const dom=new JSDOM('<html><head></head><body><section id="fornecedores" class="panel"><div class="card" id="c1"></div><div class="card" id="c2"></div></section></body></html>',{runScripts:'dangerously'}),w=dom.window,d=w.document;
let xlsx=null;w.gerarXlsx=(n,f)=>{xlsx={n,f}};w.eval(src);const A=w.classificadorV270;
const f=(o)=>Object.assign({papel:'Fornecedor',cnpj:'33.000.167/0001-01',nome_documento:'DOC',razao_social:'RAZAO',situacao:'ATIVA',regime:'Regime comum — Lucro Real ou Presumido (CRT 3)',valor_total:1000,participacao:10,ibs_cbs_2033:300,valor_aliquota_zero:0},o);
let ok=0;const teste=(n,fn)=>{fn();ok++;console.log('OK V270: '+n)};
teste('leitura do regime: regular, Simples, MEI, conflito e não identificado',()=>{
 assert.equal(A.tipoRegime('Regime comum — Lucro Real ou Presumido (CRT 3)'),'regular');assert.equal(A.tipoRegime('Simples Nacional — opSimpNac 1: Não optante do Simples (Lucro Presumido ou Real)'),'regular');
 assert.equal(A.tipoRegime('Não optante do Simples — Lucro Presumido ou Real (cadastro da Receita)'),'regular');assert.equal(A.tipoRegime('Simples Nacional (CRT 1)'),'simples');assert.equal(A.tipoRegime('Simples Nacional (CSOSN 102)'),'simples');
 assert.equal(A.tipoRegime('Simples Nacional — opSimpNac 3: Optante — ME/EPP (Simples Nacional)'),'simples');assert.equal(A.tipoRegime('Simples Nacional — opSimpNac 2: Optante — MEI'),'mei');assert.equal(A.tipoRegime('Simples Nacional — MEI (cadastro da Receita)'),'mei');
 assert.equal(A.tipoRegime('Simples Nacional (CRT 1) | Regime comum — Lucro Real ou Presumido (CRT 3)'),'conflito');assert.equal(A.tipoRegime('Não identificado nos documentos'),'indefinido');assert.equal(A.tipoRegime('Declarante do SPED: Lucro Real'),'indefinido');assert.equal(A.tipoRegime(''),'indefinido')});
teste('regime regular com itens tributados: melhor para crédito, com o IBS + CBS de 2033',()=>{const c=A.classificar(f({}));assert.equal(c.grupo,'favoravel');assert.equal(c.potencial,300);assert.match(c.motivo,/crédito integral/);assert.match(c.acao,/art\. 47/)});
teste('regime regular com parte das compras em alíquota zero: favorável, com o aviso do valor sem crédito',()=>{const c=A.classificar(f({valor_aliquota_zero:400,ibs_cbs_2033:180}));assert.equal(c.grupo,'favoravel');assert.match(c.motivo,/R\$ 400,00/)});
teste('impacto negativo: Simples, MEI, pessoa física, cadastro irregular e compras só com alíquota zero',()=>{
 assert.equal(A.classificar(f({regime:'Simples Nacional (CRT 1)'})).grupo,'negativo');assert.match(A.classificar(f({regime:'Simples Nacional (CRT 1)'})).motivo,/limitado/);
 assert.match(A.classificar(f({regime:'Simples Nacional — MEI (cadastro da Receita)'})).motivo,/MEI/);
 const pf=A.classificar(f({cnpj:'123.456.789-09',regime:'Não identificado nos documentos',situacao:''}));assert.equal(pf.grupo,'negativo');assert.match(pf.acao,/produtor rural/);
 for(const s of ['BAIXADA','INAPTA','SUSPENSA','CNPJ inválido — dígito verificador não confere','CNPJ não localizado no cadastro da Receita Federal']){const c=A.classificar(f({situacao:s}));assert.equal(c.grupo,'negativo',s);assert.match(c.motivo,/Situação cadastral/)}
 const z=A.classificar(f({ibs_cbs_2033:0,valor_aliquota_zero:1000}));assert.equal(z.grupo,'negativo');assert.match(z.motivo,/alíquota zero/)});
teste('a analisar: regime não identificado, regimes em conflito; consulta em andamento ou com falha não vira irregular',()=>{
 assert.equal(A.classificar(f({regime:'Não identificado nos documentos'})).grupo,'analisar');assert.equal(A.classificar(f({regime:'Simples Nacional (CRT 1) | Regime comum — Lucro Real ou Presumido (CRT 3)'})).grupo,'analisar');
 assert.equal(A.classificar(f({situacao:'consultando…'})).grupo,'favoravel');assert.equal(A.classificar(f({situacao:'Consulta em espera — a ferramenta tenta de novo'})).grupo,'favoravel');assert.equal(A.classificar(f({situacao:''})).grupo,'favoravel')});
const rows=[f({razao_social:'A',ibs_cbs_2033:100}),f({razao_social:'B',ibs_cbs_2033:900,valor_total:3000}),f({razao_social:'S1',regime:'Simples Nacional (CRT 1)',ibs_cbs_2033:50,valor_total:200}),f({razao_social:'S2',regime:'Simples Nacional (CRT 1)',ibs_cbs_2033:600,valor_total:2000}),
 f({razao_social:'X',regime:'Não identificado nos documentos'}),f({papel:'Cliente',razao_social:'CLIENTE'}),f({papel:'Fornecedor (emitente)',razao_social:'consultando…',nome_documento:'NOME DOC',ibs_cbs_2033:10})];
teste('clientes ficam fora; cada grupo vem do maior valor para o menor; totais somados',()=>{const a=A.analisar(rows);
 assert.equal(a.grupos.favoravel.map(x=>x.nome).join(','),'B,A,NOME DOC');assert.equal(a.grupos.negativo.map(x=>x.nome).join(','),'S2,S1');assert.equal(a.grupos.analisar.map(x=>x.nome).join(','),'X');
 assert.equal(a.total.favoravel.potencial,1010);assert.equal(a.total.negativo.potencial,650);assert.equal(a.total.negativo.valor,2200);assert.equal(a.total.analisar.n,1)});
teste('quadro na aba Fornecedores: logo após o quadro de filtros, com os dois títulos pedidos e os valores em R$',()=>{A.render(rows);const b=d.getElementById('v270-credito');assert.equal(b.previousElementSibling.id,'c1');assert.equal(b.nextElementSibling.id,'c2');
 const t=[...b.querySelectorAll('h4')].map(x=>x.textContent);assert.match(t[0],/Melhores fornecedores para crédito de IBS e CBS/);assert.match(t[1],/Fornecedores com impacto negativo na tomada de crédito/);
 assert.match(b.querySelector('.v270-q b').textContent,/^R\$ 1\.010,00$/);assert.match(b.querySelector('.v270-q.neg b').textContent,/^R\$ 650,00$/);assert.equal(b.querySelectorAll('.v270-wrap').length,3);assert.match(b.textContent,/não apuração de crédito/);
 A.render(rows);assert.equal(d.querySelectorAll('#v270-credito').length,1);A.render([]);assert.equal(b.hidden,true);A.render(rows);assert.equal(b.hidden,false)});
teste('exportação em Excel com a classificação, o motivo e a ação de todos os fornecedores',()=>{d.getElementById('v270-exportar').dispatchEvent(new w.MouseEvent('click',{bubbles:true}));assert.match(xlsx.n,/^ANALISE_CREDITO_FORNECEDORES_\d{4}-\d{2}-\d{2}\.xlsx$/);
 const l=xlsx.f[0][1];assert.equal(l.length,6);assert.equal(l[0].classificacao,'Melhor para crédito');assert.equal(l[3].classificacao,'Impacto negativo');assert.ok(l[3].por_que&&l[3].o_que_fazer)});
teste('V253 calcula o IBS + CBS de 2033 por fornecedor e chama a análise; build com a versão',()=>{assert.match(m125,/ibs_cbs_2033: x\.credito, valor_aliquota_zero: x\.semCredito/);assert.match(m125,/window\.classificadorV270\.render\(rows\)/);assert.doesNotMatch(src,/state\.|fetch\(|localStorage/);
 const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);assert.ok(dist.includes('V270_CARREGADO'))});
w.close();console.log(`${ok} testes focados V270 OK`);process.exit(0);
