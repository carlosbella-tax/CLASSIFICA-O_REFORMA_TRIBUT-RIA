/* V264 — Regressão: quadro Apuração (montante dos débitos, dos créditos e valor apurado) na Apuração assistida da CBS. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/134-v264-quadro-apuracao-cbs.js'),'utf8');
const dom=new JSDOM('<html><head></head><body><section id="apuracaocbs" class="panel active"><div class="card">Cabeçalho</div><div class="card" id="um">1. Apuração prévia</div></section></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window,d=w.document;
/* apuração prévia simulada no formato devolvido pela V256 */
const D=(lado,pa,cbs,dest,extra={})=>({lado,pa,cbs,cbsDestacada:dest,cbsEstimada:Math.round((cbs-dest)*100)/100,revisao:false,...extra});
const docs=[D('debitos','01/2027',1000,1000),D('debitos','01/2027',500.55,0),D('creditos','01/2027',300.25,300.25),D('creditos','01/2027',100,0,{revisao:true}),
 D('debitos','02/2027',200,200),D('creditos','02/2027',900,900),D('','01/2027',50,50),D('debitos','',70,70)];
w.__ap={documentos:docs,periodos:[{pa:'01/2027'},{pa:'02/2027'}]};w.__co={linhas:[]};
w.eval('var state={items:[{}]};window.__r=0;window.renderAba=id=>{window.__r++};window.classificadorV256={estado:{receita:{debitos:new Map,creditos:new Map}},previa:()=>window.__ap,conciliar:()=>window.__co};');
w.eval(src);
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V264: '+n)};const A=w.classificadorV264;const txt=id=>d.getElementById(id).textContent;
await teste('o quadro Apuração fica logo abaixo do cabeçalho da tela, antes da apuração prévia',()=>{const c=d.getElementById('v264-apuracao');assert.ok(c);assert.equal(d.querySelector('#apuracaocbs > .card').nextElementSibling,c);assert.equal(c.nextElementSibling.id,'um');assert.match(c.textContent,/Apuração da CBS/)});
await teste('total: montante dos débitos, dos créditos e valor apurado somam todos os períodos',()=>{const a=A.apurar(w.__ap,w.__co,'');
 assert.equal(a.debitos,1700.55);assert.equal(a.creditos,1300.25);assert.equal(a.valor,400.3);assert.equal(a.resultado,'CBS a recolher');assert.equal(a.docsDebito,3);assert.equal(a.docsCredito,3);
 assert.equal(a.debitosDestacados,1200);assert.equal(a.debitosEstimados,500.55);assert.equal(a.creditosDestacados,1200.25);assert.equal(a.creditosEstimados,100)});
await teste('por período: cada PA é apurado isoladamente; saldo credor quando os créditos superam os débitos',()=>{const j=A.apurar(w.__ap,w.__co,'01/2027');assert.equal(j.debitos,1500.55);assert.equal(j.creditos,400.25);assert.equal(j.valor,1100.3);assert.equal(j.resultado,'CBS a recolher');
 const f=A.apurar(w.__ap,w.__co,'02/2027');assert.equal(f.debitos,200);assert.equal(f.creditos,900);assert.equal(f.valor,-700);assert.equal(f.resultado,'Saldo credor');
 assert.equal(Math.round((j.valor+f.valor)*100)/100,A.apurar(w.__ap,w.__co,'').valor)});
await teste('documentos sem operação ou sem data ficam fora do cálculo e são contados; revisão é contada',()=>{const a=A.apurar(w.__ap,w.__co,'');assert.equal(a.foraDaApuracao,2);assert.equal(a.emRevisao,1);
 const z=A.apurar({documentos:[]},{linhas:[]},'');assert.equal(z.valor,0);assert.equal(z.resultado,'Zerado');assert.equal(z.receita,null)});
await teste('tela: os três valores aparecem em reais e o período pode ser escolhido',()=>{A.render();assert.equal(txt('v264Debitos'),'R$ 1.700,55');assert.equal(txt('v264Creditos'),'R$ 1.300,25');assert.equal(txt('v264Valor'),'R$ 400,30');assert.equal(txt('v264Resultado'),'CBS a recolher');
 const s=d.getElementById('v264Periodo');assert.deepEqual([...s.options].map(o=>o.value),['','01/2027','02/2027']);
 s.value='02/2027';s.dispatchEvent(new w.Event('input',{bubbles:true}));assert.equal(txt('v264Debitos'),'R$ 200,00');assert.equal(txt('v264Creditos'),'R$ 900,00');assert.equal(txt('v264Valor'),'R$ 700,00');assert.equal(txt('v264Resultado'),'Saldo credor');
 assert.ok(d.querySelector('.v264-q.res.credor'));assert.equal(s.value,'02/2027');s.value='';s.dispatchEvent(new w.Event('input',{bubbles:true}))});
await teste('avisos: estimativa, revisão, documentos fora do cálculo e compensação entre períodos',()=>{const n=txt('v264-notas');assert.match(n,/estimativa/);assert.match(n,/1 documento\(s\) têm NCM com enquadramento em revisão/);assert.match(n,/2 documento\(s\) ficaram fora do cálculo/);assert.match(n,/saldo credor de um período compensa/);assert.match(n,/Importe os JSON da Receita/)});
await teste('com JSON da Receita: mostra os montantes da Receita e a diferença',()=>{w.__co={linhas:[{lado:'debitos',pa:'01/2027',cbsReceita:1500},{lado:'creditos',pa:'01/2027',cbsReceita:400.25},{lado:'debitos',pa:'02/2027',cbsReceita:null},{lado:'creditos',pa:'02/2027',cbsReceita:900}]};
 const a=A.apurar(w.__ap,w.__co,'01/2027');assert.equal(a.receita.debitos,1500);assert.equal(a.receita.creditos,400.25);assert.equal(a.receita.valor,1099.75);assert.equal(a.receita.diferenca,0.55);
 A.render();const t=d.getElementById('v264ReceitaTable');assert.ok(t);assert.match(t.textContent,/JSON da Receita Federal/);assert.match(t.textContent,/Conferir na conciliação por documento/);assert.doesNotMatch(txt('v264-notas'),/Importe os JSON/);w.__co={linhas:[]};A.render();assert.equal(d.getElementById('v264ReceitaTable'),null)});
await teste('sem documentos: mostra a orientação de carga, sem valores',()=>{const g=w.__ap;w.__ap={documentos:[],periodos:[]};A.render();assert.equal(d.getElementById('v264Debitos'),null);assert.match(txt('v264Corpo'),/Carregue e processe/);w.__ap=g;A.render();assert.ok(d.getElementById('v264Debitos'))});
await teste('abrir a tela atualiza o quadro e mantém a montagem original da V256',()=>{const n=w.__r;w.renderAba('apuracaocbs');assert.equal(w.__r,n+1);w.renderAba('outra');assert.equal(w.__r,n+2)});
await teste('não cria regra de cálculo: usa a apuração prévia da V256 e não altera os dados',()=>{assert.match(src,/V256\.previa\(itens\)/);assert.doesNotMatch(src,/fetch\(|state\.items\s*=|\.push\(\{|0[,.]113|11[,.]3/)});
await teste('build: selo e título da versão e módulo presente',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO \d+/);assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);assert.ok(dist.includes('V264_CARREGADO'))});
w.close();console.log(`${ok} testes focados V264 OK`);process.exit(0);
