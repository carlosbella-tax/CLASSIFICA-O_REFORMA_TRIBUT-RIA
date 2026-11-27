/* V273 — Regressão: validação do CST e do cClassTrib dos itens contra a relação de NCM (TIPI - Base Completa)
   e a relação de NBS × código de serviço, na aba Enquadramento recomendado. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {montar,merc,nota,root} from './_v273-apoio.mjs';
const w=montar(),d=w.document,V=w.classificadorV273,S=V.STATUS;
let ok=0;const teste=(n,f)=>{f();ok++;console.log('OK V273: '+n)};
const v=r=>V.validar(r);
teste('NCM correto: cClassTrib previsto na relação e confirmado no vínculo oficial',()=>{const x=v(merc('34011190','200','200035'));assert.equal(x.status,S.CORRETO);assert.equal(x.relClasse,'200035');assert.equal(x.relCst,'200');assert.match(x.anexo,/Anexo VIII/);assert.equal(x.codigo,'3401.11.90');
 const y=v(merc('84145990','000','000001'));assert.equal(y.status,S.CORRETO);assert.equal(y.relClasse,'000001');assert.match(y.anexo,/tributação integral/)});
teste('NCM a atualizar: cClassTrib de outro anexo, CST incompatível, código encerrado ou inexistente',()=>{
 let x=v(merc('84145990','200','200035'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/não é previsto para o NCM.*CST 000 · cClassTrib 000001/);
 x=v(merc('10063021','200','200034'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/200003/);
 x=v(merc('84145990','200','000001'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/CST do documento é 200.*pertence ao CST 000/);
 x=v(merc('84145990','220','220001'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/vigência encerrada/);
 x=v(merc('84145990','999','999999'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/não existe na tabela oficial/);
 x=v(merc('84145990','','000001'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/sem o CST/)});
teste('NCM fora da TIPI ou incompleto vai para atualizar',()=>{assert.match(v(merc('99999999','000','000001')).acao,/não consta na TIPI - Base Completa/);assert.equal(v(merc('1234','000','000001')).status,S.ATUALIZAR)});
teste('a conferir: tributação integral em NCM que consta no anexo oficial; redução só pelo capítulo; código que depende da operação',()=>{
 let x=v(merc('34011190','000','000001'));assert.equal(x.status,S.CONFERIR);assert.match(x.acao,/consta no vínculo oficial do cClassTrib 200035/);
 x=v(merc('29051100','200','200038'));assert.equal(x.status,S.CONFERIR);assert.match(x.acao,/por capítulo/);
 x=v(merc('84145990','410','410004'));assert.equal(x.status,S.CONFERIR);assert.match(x.acao,/depende da operação/)});
teste('candidato só do capítulo não torna errada a tributação integral',()=>{const x=v(merc('29051100','000','000001'));assert.equal(x.status,S.CORRETO);assert.match(x.acao,/candidatos do capítulo/);assert.equal(x.relClasse,'200038 / 515001')});
teste('documento sem CST e cClassTrib: situação própria, com o que usar pela relação',()=>{const x=v(merc('84145990'));assert.equal(x.status,S.SEM);assert.match(x.acao,/CST 000 · cClassTrib 000001/);assert.equal(x.docCst,'');assert.equal(x.docClasse,'')});
teste('papel higiênico (4818.10.00) segue o Anexo VIII, cClassTrib 200035',()=>{assert.equal(v(merc('48181000','200','200035')).status,S.CORRETO);assert.equal(v(merc('48181000','000','000001')).status,S.CONFERIR)});
teste('serviço correto: par código de serviço × NBS da relação, inclusive com código nacional de 6 dígitos',()=>{let x=v(nota('01.01 / 123456','1.1502.20.00','000','000001'));assert.equal(x.status,S.CORRETO);assert.equal(x.tipo,'NBS');assert.equal(x.codigo,'1.1502.20.00');
 x=v(nota('010101 / 001','115022000'));assert.equal(x.status,S.SEM);assert.match(x.acao,/cClassTrib 000001/);
 x=v(nota('07.02','1.0107.90.00','200','200045'));assert.equal(x.status,S.CORRETO);assert.match(x.acao,/admite também 200046/)});
teste('serviço a atualizar: NBS fora da relação, NBS de outro serviço, nota sem NBS, cClassTrib não previsto',()=>{
 let x=v(nota('01.01','1.0901.10.00','000','000001'));assert.equal(x.status,S.ATUALIZAR);
 x=v(nota('01.01','1.0107.90.00','000','000001'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/não corresponde ao código de serviço 01\.01/);
 x=v(nota('01.01','','000','000001'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/Nota sem NBS.*1\.1502\.10\.00/);
 x=v(nota('01.01','1.1502.20.00','200','200052'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/não é previsto para o serviço 01\.01/);
 assert.match(v(nota('55.55','')).acao,/55\.55 não consta na relação NBS/);assert.match(v(nota('','')).acao,/sem código de serviço e sem NBS/)});
teste('relação NBS atualizada pela planilha: 04.22 usa 820001; código não aceito em NFS-e é apontado',()=>{assert.equal(v(nota('04.22','1.0910.10.00','820','820001')).status,S.CORRETO);
 const x=v(nota('05.09','1.1405.50.00','011','011005'));assert.equal(x.status,S.ATUALIZAR);assert.match(x.acao,/não é aceito em NFS-e.*atualizar a planilha/);
 const b=w.ANEXO_VIII_CORRELACAO;assert.equal(b.length,1603);assert.ok(b.every(k=>/^\d{6}$/.test(k.indop)&&/^\d{6}$/.test(k.cClassTrib)));assert.equal(w.ANEXO_VIII_CORRELACAO_FONTE.nbs,731);
 assert.ok(!b.some(k=>k.codigo==='01.06'&&k.cClassTrib==='000002'));assert.ok(b.some(k=>k.codigo==='99.02.01'))});
const carga=[merc('34011190','200','200035',500),merc('34011190','200','200035',250.5),merc('84145990','200','200035',80),merc('84145990','410','410004',40),merc('84145990',undefined,undefined,10),nota('01.01','1.1502.20.00','000','000001',1000)];
teste('resumo: totais por situação, grupos por código e ordem com o que exige ação primeiro',()=>{const r=V.resumir(carga);assert.equal(r.total,6);
 assert.equal(r.totais[S.CORRETO].itens,3);assert.equal(r.totais[S.CORRETO].valor,1750.5);assert.equal(r.totais[S.CORRETO].codigos,2);assert.equal(r.totais[S.ATUALIZAR].itens,1);assert.equal(r.totais[S.CONFERIR].itens,1);assert.equal(r.totais[S.SEM].itens,1);
 assert.equal(r.grupos.map(g=>g.status).join('|'),[S.ATUALIZAR,S.CONFERIR,S.SEM,S.CORRETO,S.CORRETO].join('|'));const g=r.grupos.find(x=>x.chave==='34011190');assert.equal(g.itens,2);assert.equal(g.valor,750.5);
 assert.equal(Object.values(r.totais).reduce((s,t)=>s+t.itens,0),6)});
teste('tela: quadro acima da tabela, quatro situações e duas colunas novas em todas as linhas',()=>{w.state.items=carga;w.classificadorRenderEnquadramentoRecomendado();V.render();
 const c=d.getElementById('v273-validacao');assert.ok(c);assert.equal(c.nextElementSibling.className.includes('v180-enquadramento'),true);assert.equal(c.querySelectorAll('.v273-tile').length,4);
 assert.equal(c.querySelector('.v273-tile.ok b').textContent,'3');assert.match(c.querySelector('.v273-tile.ok small').textContent,/R\$\s1\.750,50/);assert.equal(c.querySelectorAll('#v273Tabela tbody tr').length,5);
 const tb=d.querySelector('#observacoes .v180-enquadramento .v180-scroll table'),ths=[...tb.tHead.rows[0].cells].map(x=>x.textContent);
 assert.equal(ths[5],'CST / cClassTrib no documento');assert.equal(ths[6],'Validação NCM/NBS');
 const linhas=[...tb.tBodies[0].rows];assert.equal(linhas.length,6);assert.equal(linhas[0].cells[5].textContent,'200 / 200035');assert.match(linhas[0].cells[6].textContent,/^CORRETO/);assert.match(linhas[2].cells[6].textContent,/^ATUALIZAR/);assert.equal(linhas[4].cells[5].textContent,'não informado');
 V.render();assert.equal([...tb.tHead.rows[0].cells].filter(x=>x.textContent==='Validação NCM/NBS').length,1)});
teste('filtro por situação e exportação em Excel com três planilhas',()=>{d.querySelector('[data-v273-filtro="ATUALIZAR"]').click();
 assert.equal(d.querySelectorAll('#v273Tabela tbody tr').length,1);assert.ok(d.querySelector('.v273-tile.ruim.ativo'));d.querySelector('[data-v273-filtro="ATUALIZAR"]').click();assert.equal(d.querySelectorAll('#v273Tabela tbody tr').length,5);
 w.eval('window.__cap=null;var gerarXlsx=function(n,f){window.__cap={n:n,f:f}};');d.getElementById('v273-exportar').click();const cap=w.__cap;assert.ok(cap);assert.match(cap.n,/^VALIDACAO_NCM_NBS_/);assert.equal(cap.f.map(x=>x[0]).join('|'),'Resumo da validação|Validação por código|Validação por item');
 assert.equal(cap.f[2][1].length,6);assert.equal(cap.f[2][1][0].valor,500);assert.equal(cap.f[2][1][0].situacao,'CORRETO');assert.equal(cap.f[1][1][0].situacao,'ATUALIZAR');assert.equal(cap.f[0][1].length,4)});
teste('somente leitura: itens não são alterados; build com a versão e o módulo',()=>{const antes=JSON.stringify(carga);V.resumir(carga);assert.equal(JSON.stringify(carga),antes);
 const src=fs.readFileSync(path.join(root,'src/js/modulos/142-v273-validacao-ncm-nbs.js'),'utf8');assert.doesNotMatch(src,/state\.items\s*=|fetch\(|localStorage/);
 const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.ok(dist.includes('V273_CARREGADO'));assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/)});
w.close();console.log(`${ok} testes focados V273 OK`);process.exit(0);
