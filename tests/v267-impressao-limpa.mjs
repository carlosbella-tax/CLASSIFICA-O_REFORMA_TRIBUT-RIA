/* V267 — Regressão: impressão limpa do Dashboard e das telas de análise (só o conteúdo da tela aberta). */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/137-v267-impressao-limpa.js'),'utf8');
const dom=new JSDOM('<html><head></head><body><aside id="v123-sidebar"></aside><header class="v123-header"></header><main class="wrap"><section id="items" class="panel"></section><section id="dashboard" class="panel active"></section><section id="ibscbs" class="panel"></section></main></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window,d=w.document;
w.eval(src);const A=w.classificadorV267,css=d.getElementById('v267-impressao-style').textContent;
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V267: '+n)};
const abrir=id=>{d.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active',p.id===id))};
await teste('Dashboard aberto: a página é marcada para a impressão limpa',()=>{assert.equal(A.marcar(),'dashboard');assert.equal(d.body.dataset.v267Imprimir,'dashboard')});
await teste('a marca acompanha a tela aberta, inclusive no momento de imprimir',()=>{abrir('ibscbs');w.dispatchEvent(new w.Event('beforeprint'));assert.equal(d.body.dataset.v267Imprimir,'ibscbs')});
await teste('a Consulta NCM/NBS mantém a impressão própria',()=>{abrir('items');assert.equal(A.marcar(),'');assert.equal('v267Imprimir' in d.body.dataset,false);abrir('dashboard');A.marcar()});
await teste('na impressão: some tudo fora da tela aberta (menu, cabeçalho da empresa, outras abas)',()=>{
 assert.ok(css.includes('html body[data-v267-imprimir]>*:not(main):not(#_#_#_){display:none!important}'));assert.ok(css.includes('html body[data-v267-imprimir]>main.wrap>*:not(.panel.active):not(#_#_#_){display:none!important}'));
 assert.ok(css.includes('html body[data-v267-imprimir]>main.wrap>.panel.active{display:block!important'))});
await teste('na impressão: sem recuo do menu, margem mínima, sem alturas fixas nem faixas de rolagem, sem botões',()=>{
 assert.match(css,/@page\{margin:6mm\}/);assert.match(css,/body\[data-v267-imprimir\]\{margin:0!important;padding:0!important/);assert.match(css,/\.table-wrap,[^{]*\{height:auto!important;min-height:0!important;max-height:none!important;overflow:visible!important/);
 assert.match(css,/\.panel\.active button,/);assert.match(css,/#dashboard \.dashboard-hero/);assert.ok(css.trim().startsWith('@media print{'))});
await teste('só estilo de impressão: não altera dados nem a tela; build com a versão',()=>{assert.doesNotMatch(src,/state\.|fetch\(|localStorage|window\.print/);
 const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);assert.ok(dist.includes('V267_CARREGADO'))});
w.close();console.log(`${ok} testes focados V267 OK`);process.exit(0);
