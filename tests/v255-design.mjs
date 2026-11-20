/* V255 — Regressão do padrão visual institucional: classe e folha de estilo, controle de densidade
   persistente, alinhamento de colunas numéricas e garantia de que dados e cálculos não mudam. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const dom=new JSDOM('<html><head></head><body><aside id="v123-sidebar"><button class="v123-link active" data-v123-key="ibs">Base<small>0</small></button></aside>'
 +'<main><section class="panel active"><table id="t"><thead><tr><th>CNPJ</th><th>Nome</th><th>Valor</th><th>%</th><th>NCM</th><th>Qtd</th></tr></thead><tbody>'
 +'<tr><td>33.000.167/0001-01</td><td>ALFA</td><td>R$ 1.500,50</td><td>11,30%</td><td>02023000</td><td>10</td></tr>'
 +'<tr><td>60.746.948/0001-12</td><td>BETA</td><td>R$ 20,00</td><td>—</td><td>8471.30.00</td><td>3</td></tr></tbody></table></section></main></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;
w.eval(fs.readFileSync(path.join(root,'src/js/modulos/127-v255-design-institucional.js'),'utf8'));
let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V255: '+nome)};
const d=w.document;
await teste('classe v255 e folha de estilo única com as cores aprovadas',()=>{assert.ok(d.body.classList.contains('v255'));assert.equal(d.querySelectorAll('#v255-design').length,1);const c=d.getElementById('v255-design').textContent;for(const cor of ['#0F2A4A','#2456C8','#15803D','#B91C1C'])assert.ok(c.includes(cor),cor);assert.match(c,/tabular-nums/)});
await teste('todas as regras ficam restritas a body.v255 (ou :root)',()=>{const c=d.getElementById('v255-design').textContent.trim().split('\n');assert.ok(c.every(l=>/^(:root|body\.v255)/.test(l)),c.find(l=>!/^(:root|body\.v255)/.test(l)))});
await teste('controle de densidade: um só, padrão inicial e alternância persistente',()=>{const b=d.querySelectorAll('.v255-densidade button');assert.equal(d.querySelectorAll('.v255-densidade').length,1);assert.equal(b.length,2);assert.ok(b[0].classList.contains('on'));
 b[1].click();assert.ok(d.body.classList.contains('v255-compacta'));assert.equal(w.localStorage.getItem('classificador.v255.densidade'),'compacta');assert.ok(b[1].classList.contains('on')&&!b[0].classList.contains('on'));
 b[0].click();assert.ok(!d.body.classList.contains('v255-compacta'));assert.equal(w.localStorage.getItem('classificador.v255.densidade'),'padrao')});
await teste('reconhece valores: R$, % e número; não trata CNPJ, NCM ou chave como valor',()=>{const n=w.classificadorV255Numerico;for(const t of ['R$ 1.500,50','11,30%','10','-3,5','1.234'])assert.ok(n(t),t);for(const t of ['33.000.167/0001-01','02023000','8471.30.00','ALFA','35261133000167000101550010000010010001000100'])assert.ok(!n(t),t)});
await teste('alinha à direita só as colunas numéricas (Valor, % e Qtd)',()=>{w.classificadorV255Alinhar();const r=d.getElementById('v255-colunas').textContent;assert.match(r,/nth-child\(3\)/);assert.match(r,/nth-child\(4\)/);assert.match(r,/nth-child\(6\)/);assert.doesNotMatch(r,/nth-child\([125]\)/)});
await teste('não altera o conteúdo das células',()=>{assert.equal(d.querySelector('#t tbody tr td:nth-child(3)').textContent,'R$ 1.500,50');assert.equal(d.querySelectorAll('#t td').length,12)});
await teste('build: selo, título e módulo V255 presentes; V254 e V253 preservados',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO \d+/);assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);for(const m of ['V255_CARREGADO','V254_CARREGADO','V253_CARREGADO'])assert.ok(dist.includes(m),m)});
w.close();console.log(`${ok} testes focados V255 OK`);process.exit(0);
