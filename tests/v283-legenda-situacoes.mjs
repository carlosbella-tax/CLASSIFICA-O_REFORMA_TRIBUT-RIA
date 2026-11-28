/* V283 — Regressão: legenda das situações na tela Enquadramento recomendado (o que cada situação representa,
   quando aparece e o que fazer), na tela, no Excel da validação e na impressão. */
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';
import {montar,merc,nota,root} from './_v273-apoio.mjs';
const w=montar(),d=w.document,V=w.classificadorV273,S=V.STATUS,T=V.TRATAMENTO;
let ok=0;const teste=(n,f)=>{f();ok++;console.log('OK V283: '+n)};
const puro=x=>JSON.parse(JSON.stringify(x));
const carga=[merc('34011190','200','200035',500),merc('84145990','200','200035',300),merc('84145990',null,null,200),nota('17.01','1.1401.11.00','','',1000)];
const abrir=()=>{w.state.items=carga;d.querySelector('.tab[data-tab="observacoes"]').classList.add('active');w.classificadorRenderEnquadramentoRecomendado();V.render()};
const leg=()=>d.getElementById('v283-legenda');
const linhasLeg=()=>[...leg().querySelectorAll('table.v283-t tbody tr')].map(tr=>[...tr.cells].map(c=>c.textContent));

teste('a legenda cobre as quatro situações da validação e as três do Tratamento IBS/CBS, sem sobra nem falta',()=>{
  const L=puro(V.LEGENDA);assert.equal(L.length,2);
  assert.deepEqual(L[0].itens.map(i=>i.situacao),[S.ATUALIZAR,S.CONFERIR,S.SEM,S.CORRETO]);
  assert.deepEqual(L[0].itens.map(i=>i.situacao).sort(),Object.values(puro(S)).sort());
  assert.deepEqual(L[1].itens.map(i=>i.situacao),[T.REFERENCIA,T.REVISAO,T.ANALISE]);
  assert.deepEqual(puro(T),{REFERENCIA:'REFERÊNCIA DOCUMENTAL',REVISAO:'REVISÃO NECESSÁRIA',ANALISE:'ANÁLISE NECESSÁRIA'});
  for(const g of L){assert.ok(g.grupo&&g.onde&&g.explica);for(const i of g.itens)for(const k of ['representa','quando','fazer'])assert.ok(i[k].length>30,i.situacao+' '+k)}});

teste('os nomes do Tratamento IBS/CBS na legenda são os mesmos que os módulos da tela gravam',()=>{
  const fontes=['103-v180-enquadramento-recomendado-item.js','123-v251-nfse-enquadramento-servico.js','124-v252-aliquotas-anexos-legais.js','126-v254-divergencias-motor.js']
    .map(f=>fs.readFileSync(path.join(root,'src/js/modulos',f),'utf8')).join('\n');
  const usados=[...new Set([...fontes.matchAll(/'((?:REFERÊNCIA|REVISÃO|ANÁLISE) [A-ZÁÉÍÓÚÂÊÔÃÇ]+)'/g)].map(m=>m[1]))].sort();
  assert.deepEqual(usados,Object.values(puro(T)).sort())});

teste('cada situação descrita corresponde ao que a validação devolve nos casos da regra',()=>{
  const v=r=>V.validar(r).status;
  assert.equal(v(merc('34011190','200','200035')),S.CORRETO);assert.equal(v(merc('84145990','000','000001')),S.CORRETO);
  assert.equal(v(merc('84145990','200','200035')),S.ATUALIZAR);assert.equal(v(merc('8414599','000','000001')),S.ATUALIZAR);assert.equal(v(merc('84145990','000','')),S.ATUALIZAR);
  assert.equal(v(merc('84145990',null,null)),S.SEM);assert.equal(v(nota('17.01','1.1401.11.00','','')),S.SEM);
  /* NCM inválido sem CST: aparece em ATUALIZAR, não em SEM IBS/CBS NO DOCUMENTO, como a legenda diz */
  assert.equal(v(merc('00000000',null,null)),S.ATUALIZAR);assert.equal(v(nota('17.01','','','')),S.ATUALIZAR);
  /* código que não existe na tabela oficial → ATUALIZAR; código que existe e depende da operação (410999) → CONFERIR */
  assert.equal(v(merc('84145990','999','999999')),S.ATUALIZAR);assert.equal(v(merc('84145990','200','200999')),S.ATUALIZAR);assert.equal(v(merc('84145990','200','000001')),S.ATUALIZAR);
  assert.equal(v(merc('84145990','410','410999')),S.CONFERIR);assert.equal(v(nota('17.01','1.1401.11.00','410','410999')),S.CONFERIR);
  assert.equal(v(nota('','','','')),S.ATUALIZAR);assert.equal(v(nota('17.01','1.0101.11.00','','')),S.ATUALIZAR);assert.equal(v(nota('05.09','1.1405.50.00','000','000001')),S.ATUALIZAR)});

teste('tela: legenda dentro do quadro da validação, entre os quadros coloridos e a tabela, aberta por padrão',()=>{
  abrir();const c=d.getElementById('v273-validacao'),l=leg();assert.ok(l);assert.equal(l.parentElement,c);
  assert.equal(l.previousElementSibling.className,'v273-tiles');assert.equal(l.nextElementSibling.className,'v273-barra');
  assert.equal(l.classList.contains('fechada'),false);assert.equal(l.querySelector('.v283-cab b').textContent,'Legenda das situações');
  assert.match(l.querySelector('.v283-cab span').textContent,/O que cada situação desta tela representa, quando aparece e o que fazer\. A validação é somente leitura/);
  assert.equal(l.querySelectorAll('table.v283-t').length,2);assert.equal(linhasLeg().length,7);
  assert.deepEqual([...l.querySelectorAll('table.v283-t')[0].tHead.rows[0].cells].map(x=>x.textContent),['Situação','O que representa','Quando aparece','O que fazer']);
  assert.deepEqual(linhasLeg().map(x=>x[0]),[S.ATUALIZAR,S.CONFERIR,S.SEM,S.CORRETO,T.REFERENCIA,T.REVISAO,T.ANALISE]);
  const g=[...l.querySelectorAll('.v283-grupo')].map(x=>x.textContent);assert.equal(g.length,2);
  assert.match(g[0],/^Situação — quadros coloridos, coluna Situação da tabela de validação e coluna Validação NCM\/NBS da tabela de itens\./);
  assert.match(g[1],/^Tratamento IBS\/CBS — coluna Tratamento IBS\/CBS da tabela Enquadramento recomendado, item a item\./)});

teste('as situações da validação usam na legenda as mesmas cores dos quadros e da tabela',()=>{
  const cls=s=>leg().querySelector('table.v283-t tbody tr:nth-child('+s+') .v273-tag').className;
  assert.equal(cls(1),'v273-tag ruim');assert.equal(cls(2),'v273-tag conf');assert.equal(cls(3),'v273-tag sem');assert.equal(cls(4),'v273-tag ok');
  for(const s of [S.ATUALIZAR,S.CONFERIR,S.SEM,S.CORRETO]){const tile=[...d.querySelectorAll('.v273-tile')].find(x=>x.querySelector('span').textContent===s);
    const tagLeg=[...leg().querySelectorAll('.v273-tag')].find(x=>x.textContent===s);assert.ok(tile.classList.contains(tagLeg.className.replace('v273-tag ','')),s)}
  assert.equal(leg().querySelectorAll('table.v283-t')[1].querySelectorAll('.v273-tag').length,0)});

teste('textos: cada situação diz o que representa e o que fazer',()=>{
  const de=s=>linhasLeg().find(x=>x[0]===s);
  assert.match(de(S.ATUALIZAR)[1],/Há um erro ou uma falta no NCM, na NBS, no CST ou no cClassTrib/);assert.match(de(S.ATUALIZAR)[2],/vigência encerrada/);assert.match(de(S.ATUALIZAR)[3],/Corrigir o cadastro do item ou a emissão do documento/);
  assert.match(de(S.CONFERIR)[1],/depende da operação ou de confirmar o item no anexo/);assert.match(de(S.CONFERIR)[2],/Motor × Classificador/);
  assert.match(de(S.SEM)[1],/não informa CST nem cClassTrib de IBS\/CBS.*Não indica acerto nem erro/);assert.match(de(S.SEM)[2],/aparece em ATUALIZAR/);
  assert.match(de(S.CORRETO)[1],/batem com a relação/);assert.match(de(S.CORRETO)[3],/^Nenhum ajuste/);
  assert.match(de(T.REFERENCIA)[1],/única hipótese vigente e não vedada/);assert.match(de(T.REVISAO)[1],/mais de uma hipótese possível/);assert.match(de(T.REVISAO)[3],/A confirmar/);
  assert.match(de(T.ANALISE)[1],/não encontrou enquadramento documentado/)});

teste('a tabela de itens mostra situações que estão todas na legenda',()=>{
  const tb=d.querySelector('#observacoes .v180-enquadramento .v180-scroll table'),ths=[...tb.tHead.rows[0].cells].map(x=>x.textContent),na=linhasLeg().map(x=>x[0]);
  const iv=ths.indexOf('Validação NCM/NBS'),it=ths.indexOf('Tratamento IBS/CBS');assert.ok(iv>0&&it>0);
  for(const tr of tb.tBodies[0].rows){assert.ok(na.includes(tr.cells[iv].querySelector('.v273-tag').textContent));assert.ok(na.includes(tr.cells[it].querySelector('b').textContent),tr.cells[it].textContent.slice(0,40))}
  assert.equal(tb.tBodies[0].rows.length,4)});

teste('botão Ocultar legenda recolhe e Mostrar legenda reabre; a escolha se mantém ao filtrar e ao remontar a tela',()=>{
  let b=leg().querySelector('[data-v283-alternar]');assert.equal(b.textContent,'Ocultar legenda');assert.equal(b.getAttribute('aria-expanded'),'true');assert.equal(b.getAttribute('aria-controls'),'v283-corpo');
  b.click();assert.equal(leg().classList.contains('fechada'),true);b=leg().querySelector('[data-v283-alternar]');assert.equal(b.textContent,'Mostrar legenda');assert.equal(b.getAttribute('aria-expanded'),'false');
  assert.equal(linhasLeg().length,7,'recolhida, a legenda continua na página para a impressão');
  d.querySelector('[data-v273-filtro="ATUALIZAR"]').click();assert.equal(leg().classList.contains('fechada'),true);d.querySelector('[data-v273-filtro="ATUALIZAR"]').click();
  V.render();assert.equal(leg().classList.contains('fechada'),true);
  leg().querySelector('[data-v283-alternar]').click();assert.equal(leg().classList.contains('fechada'),false);assert.equal(d.querySelectorAll('#v283-legenda').length,1)});

teste('a legenda não muda os quadros, o filtro nem a tabela da validação',()=>{
  assert.equal(d.querySelectorAll('.v273-tile').length,4);assert.equal(d.querySelectorAll('#v273Tabela tbody tr').length,4);
  d.querySelector('[data-v273-filtro="CORRETO"]').click();assert.equal(d.querySelectorAll('#v273Tabela tbody tr').length,1);assert.ok(leg());
  d.querySelector('[data-v273-filtro="CORRETO"]').click();assert.equal(d.querySelectorAll('#v273Tabela tbody tr').length,4)});

teste('Excel da validação: planilha Legenda das situações com as sete situações',()=>{
  w.eval('window.__cap=null;var gerarXlsx=function(n,f){window.__cap={n:n,f:f}};');d.getElementById('v273-exportar').click();const cap=w.__cap;assert.ok(cap);
  assert.equal(cap.f.map(x=>x[0]).join('|'),'Resumo da validação|Validação por código|Validação por item|Legenda das situações');
  const l=puro(cap.f[3][1]);assert.equal(l.length,7);assert.deepEqual(Object.keys(l[0]),['Onde aparece','Situação','O que representa','Quando aparece','O que fazer']);
  assert.deepEqual(l.map(x=>x['Situação']),[S.ATUALIZAR,S.CONFERIR,S.SEM,S.CORRETO,T.REFERENCIA,T.REVISAO,T.ANALISE]);
  assert.match(l[0]['Onde aparece'],/^Situação — quadros coloridos/);assert.match(l[4]['Onde aparece'],/^Tratamento IBS\/CBS — coluna Tratamento IBS\/CBS/);
  /* o texto da planilha é o mesmo da tela */
  const tela=linhasLeg();l.forEach((x,i)=>{assert.equal(x['O que representa'],tela[i][1]);assert.equal(x['Quando aparece'],tela[i][2]);assert.equal(x['O que fazer'],tela[i][3])});
  assert.deepEqual(puro(V.legendaLinhas()),l);assert.equal(cap.f[2][1].length,4,'as planilhas da validação continuam com os itens')});

teste('Excel da aba (tabela de itens) também leva a legenda',()=>{
  const src=fs.readFileSync(path.join(root,'src/js/modulos/106-v183-resumos-acoes-dashboard.js'),'utf8');
  assert.match(src,/\[\['Enquadramento recomendado',linhas\]\]\.concat\(legenda\.length\?\[\['Legenda das situações',legenda\]\]:\[\]\)/);assert.match(src,/classificadorV273\.legendaLinhas\(\)/)});

teste('impressão: a legenda sai aberta mesmo se estiver recolhida na tela, sem o botão',()=>{
  const css=d.getElementById('v273-style').textContent,imp=css.slice(css.lastIndexOf('@media print'));
  assert.match(imp,/\.v283-cab button\{display:none!important\}/);assert.match(imp,/\.v283-legenda\.fechada \.v283-corpo\{display:block!important\}/);assert.match(imp,/break-inside:avoid/);assert.match(imp,/table\.v283-t th,table\.v283-t td\{font-size:9\.5px!important/,'a legenda não herda os 7px da impressão antiga');
  assert.match(css,/\.v283-legenda\.fechada \.v283-corpo\{display:none\}/)});

teste('sem documentos a legenda não aparece; somente leitura; build com a versão e a legenda',()=>{
  const antes=JSON.stringify(carga);V.resumir(carga);V.legendaLinhas();assert.equal(JSON.stringify(carga),antes);
  w.state.items=[];w.classificadorRenderEnquadramentoRecomendado();V.render();assert.equal(d.getElementById('v273-validacao'),null);assert.equal(leg(),null);
  const src=fs.readFileSync(path.join(root,'src/js/modulos/142-v273-validacao-ncm-nbs.js'),'utf8');assert.doesNotMatch(src,/state\.items\s*=|fetch\(|localStorage/);
  const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);assert.ok(dist.includes('v283-legenda'));assert.ok(dist.includes('Legenda das situações'))});
w.close();console.log(`${ok} testes V283 OK`);process.exit(0);
