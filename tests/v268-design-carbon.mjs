/* V268 — Regressão: design Carbon + TaxAdvice nas telas de análise; a Consulta fica de fora. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/138-v268-design-carbon-taxadvice.js'),'utf8');
const dom=new JSDOM('<html><head></head><body class="v255"><main></main></body></html>',{runScripts:'dangerously'}),w=dom.window,d=w.document;
w.eval(src);const css=d.getElementById('v268-design').textContent;
let ok=0;const teste=(n,f)=>{f();ok++;console.log('OK V268: '+n)};
teste('estilo carregado uma única vez',()=>{w.eval(src);assert.equal(d.querySelectorAll('#v268-design').length,1);assert.equal(w.classificadorV268.direcao,'Carbon + TaxAdvice')});
teste('item ativo do menu com o laranja da TaxAdvice',()=>{assert.match(css,/--v268-laranja:#F26B21/);assert.match(css,/\.v123-link\.active\{border-left-color:var\(--v268-laranja\)!important/)});
teste('telas de análise: cantos retos, fundo cinza-claro e cabeçalho de tabela cinza',()=>{assert.match(css,/border-radius:0!important;box-shadow:none!important/);assert.match(css,/--v268-fundo:#F4F4F4/);assert.match(css,/table th\{background:#E0E0E0!important/)});
teste('indicadores com faixa colorida no topo (azul, amarelo de alerta, verde)',()=>{assert.match(css,/border-top:3px solid var\(--v268-azul\)!important/);assert.match(css,/\.v260-kpi\.alerta\{border-top-color:#F1C21B!important\}/);assert.match(css,/\.v260-kpi\.ok\{border-top-color:#198038!important\}/)});
teste('a Consulta NCM/NBS fica de fora: toda regra de conteúdo exige que não seja o modo consulta',()=>{
 const regras=css.split('}').map(r=>r.split('{')[0].trim()).filter(Boolean);
 for(const sel of regras)for(const s of sel.split(',')){const t=s.trim();if(/ main|^body\.v255:not/.test(t))assert.ok(t.startsWith('body.v255:not(.v219-modo-consulta)'),t)}
 assert.ok(regras.some(r=>r.includes(' main table th')))});
teste('só apresentação; build com a versão',()=>{assert.doesNotMatch(src,/state\.|fetch\(|localStorage|addEventListener/);
 const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);assert.ok(dist.includes('V268_CARREGADO'))});
w.close();console.log(`${ok} testes focados V268 OK`);process.exit(0);
