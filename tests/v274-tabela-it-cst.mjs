/* V274 — Regressão: a validação NCM/NBS usa a Tabela IT 2025.002 v.1.71 como fonte do CST (coluna A),
   da Descrição CST-IBS/CBS (coluna B) e do cClassTrib (coluna C). */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {montar,merc,nota,root} from './_v273-apoio.mjs';
const w=montar(),d=w.document,V=w.classificadorV273,S=V.STATUS,IT=w.IT_2025_002;
let ok=0;const teste=(n,f)=>{f();ok++;console.log('OK V274: '+n)};
const v=r=>V.validar(r);
teste('tabela carregada: 173 cClassTrib, 18 CST, versão 1.71 e o CST igual ao prefixo do cClassTrib',()=>{
 assert.equal(IT.versao,'1.71');assert.equal(Object.keys(IT.classes).length,173);assert.equal(Object.keys(IT.csts).length,18);
 for(const [k,c] of Object.entries(IT.classes)){assert.equal(k.slice(0,3),c.cst,k);assert.ok(c.descCst,k);assert.ok(IT.csts[c.cst],k)}});
teste('Descrição CST-IBS/CBS vem da coluna B, por cClassTrib',()=>{
 assert.equal(w.classificadorIt2025002('000001').descCst,'Tributação integral');
 assert.equal(w.classificadorIt2025002('200035').descCst,'Alíquota reduzida em 60%');
 assert.equal(w.classificadorIt2025002('200003').descCst,'Alíquota zero');
 assert.equal(w.classificadorIt2025002('200009').descCst,'Alíquota zero');
 assert.equal(w.classificadorIt2025002('011005').descCst,'Tributação com alíquotas uniformes reduzidas em 30%');
 assert.equal(w.classificadorIt2025002('410004').descCst,'Imunidade e não incidência');
 assert.equal(w.classificadorIt2025002('620001').cst,'620');
 assert.equal(w.classificadorIt2025002(200035).cClassTrib,'200035');assert.equal(w.classificadorIt2025002('999999'),null)});
teste('validação devolve a descrição do CST do documento e da relação',()=>{
 let x=v(merc('34011190','200','200035'));assert.equal(x.status,S.CORRETO);assert.equal(x.docDescCst,'Alíquota reduzida em 60%');assert.equal(x.relDescCst,'Alíquota reduzida em 60%');
 x=v(merc('84145990','000','000001'));assert.equal(x.docDescCst,'Tributação integral');assert.equal(x.relDescCst,'Tributação integral');
 x=v(merc('84145990'));assert.equal(x.docDescCst,'');assert.equal(x.relDescCst,'Tributação integral');
 x=v(merc('29051100','000','000001'));assert.equal(x.relDescCst,'Alíquota reduzida em 60% / Diferimento com redução de alíquota');
 x=v(nota('01.01','1.1502.20.00','000','000001'));assert.equal(x.docDescCst,'Tributação integral');assert.equal(x.relDescCst,'Tributação integral')});
teste('CST do documento diferente do CST do cClassTrib: descrição é a do CST informado',()=>{
 const x=v(merc('84145990','200','000001'));assert.equal(x.status,S.ATUALIZAR);assert.equal(x.docDescCst,'Alíquota reduzida');assert.match(x.acao,/pertence ao CST 000/)});
teste('vigência pela tabela: 220001 a 220003 encerrados em 01/01/2026',()=>{
 for(const c of ['220001','220002','220003']){const x=v(merc('84145990','220',c));assert.equal(x.status,S.ATUALIZAR,c);assert.match(x.acao,/vigência encerrada na tabela oficial desde 01\/01\/2026/)}});
teste('cClassTrib não aceito no tipo de documento do item',()=>{
 let x=v(merc('84145990','410','410037',100,'55'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/não é aceito em NF-e na tabela oficial \(aceito em: DIR, DUIMP\)/);
 x=v(merc('34011190','200','200035',100,'65'));assert.equal(x.status,S.CORRETO);
 x=v(merc('84145990','410','410030',100,'65'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/não é aceito em NFC-e/);
 x=v(merc('84145990','410','410037'));assert.doesNotMatch(x.acao,/não é aceito em/,'sem modelo conhecido não confere o tipo de documento');
 x=v(nota('05.09','1.1405.50.00','011','011005'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/não é aceito em NFS-e na tabela oficial \(aceito em: DERE\)/)});
teste('tela: descrição do CST no quadro, nas colunas da tabela de itens e a fonte citada',()=>{
 w.state.items=[merc('34011190','200','200035',500),merc('84145990','000','000001',300),merc('84145990',null,null,200)];
 d.querySelector('.tab[data-tab="observacoes"]').classList.add('active');w.classificadorRenderEnquadramentoRecomendado();V.render();
 const card=d.getElementById('v273-validacao');assert.ok(card);
 assert.match(card.querySelector('.v273-sub').textContent,/Tabela IT 2025\.002 v\.1\.71/);
 const txt=card.querySelector('#v273Tabela').textContent;assert.match(txt,/Alíquota reduzida em 60%/);assert.match(txt,/Tributação integral/);
 assert.match(card.querySelector('#v273Tabela thead').textContent,/Descrição do CST/);
 const linhas=[...d.querySelectorAll('#observacoes .v180-enquadramento .v180-scroll tbody tr')];assert.equal(linhas.length,3);
 assert.match(linhas[0].cells[5].textContent,/200 \/ 200035.*Alíquota reduzida em 60%/);assert.match(linhas[1].cells[5].textContent,/Tributação integral/);assert.equal(linhas[2].cells[5].textContent,'não informado')});
teste('exportação leva a descrição do CST do documento e da relação',()=>{
 w.eval('window.__cap=null;var gerarXlsx=function(n,f){window.__cap={n:n,f:f}};');V.exportar();const saida=w.__cap&&{abas:w.__cap.f};assert.ok(saida);
 const porCodigo=saida.abas[1][1],porItem=saida.abas[2][1];
 assert.ok(porCodigo.some(l=>l.descricao_cst_documento==='Alíquota reduzida em 60%'&&l.descricao_cst_relacao==='Alíquota reduzida em 60%'));
 assert.ok(porItem.every(l=>'descricao_cst_documento' in l&&'descricao_cst_relacao' in l));
 assert.equal(porItem[2].descricao_cst_documento,'');assert.equal(porItem[2].descricao_cst_relacao,'Tributação integral')});
teste('itens não são alterados; build traz a tabela e a versão',()=>{
 const antes=JSON.stringify(w.state.items);V.render();assert.equal(JSON.stringify(w.state.items),antes);
 const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');assert.match(html,/Tabela IT 2025\.002 v\.1\.71/);assert.match(html,/window\.classificadorIt2025002=/);
 assert.ok(JSON.parse(fs.readFileSync(path.join(root,'versao.json'),'utf8')).versao>=274)});
w.close();console.log(ok+' testes focados V274 OK');process.exit(0);
