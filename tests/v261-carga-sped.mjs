/* V261 — Regressão: opções SPED Fiscal e EFD Contribuições no menu Documentos e no painel de carga. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/132-v261-carga-sped-efd.js'),'utf8');
const html='<html><head></head><body><aside id="v123-sidebar"><button class="v123-link" data-v123-key="documentos" data-v123-tab="load">Carregar XML/PDF<small>0</small></button><button class="v123-link" data-v123-key="nfe">NF-e<small>0</small></button><button class="v123-link" data-v123-key="cte">CT-e<small>0</small></button><button class="v123-link" data-v123-key="ibs">Base<small>0</small></button></aside><div id="v123-title">x</div><main class="wrap"><section id="load" class="panel"><div class="card"><div id="drop"><strong>Arraste os XMLs ou a pasta para cá</strong><input id="files" type="file" multiple hidden></div></div></section></main></body></html>';
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window,d=w.document;
w.eval('var state={items:[]};window.__env=[];window.classificadorV261Enviar=a=>{window.__env.push(a.map(f=>f.name))};');
d.querySelector('[data-v123-key="documentos"]').addEventListener('click',()=>{d.getElementById('load').classList.add('active')});
w.eval(src);
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V261: '+n)};const espera=ms=>new Promise(r=>setTimeout(r,ms));
await teste('menu Documentos ganha SPED Fiscal e EFD Contribuições logo depois do CT-e',()=>{
 const k=[...d.querySelectorAll('#v123-sidebar .v123-link')].map(x=>x.dataset.v123Key);assert.deepEqual(k,['documentos','nfe','cte','spedfiscal','efdcontrib','ibs']);
 assert.match(d.querySelector('[data-v123-key="spedfiscal"]').textContent,/SPED Fiscal — EFD ICMS\/IPI0/);assert.match(d.querySelector('[data-v123-key="efdcontrib"]').textContent,/EFD Contribuições0/)});
await teste('painel de carga tem o bloco SPED com os dois botões e aceita .txt',()=>{
 const b=d.getElementById('v261-sped');assert.ok(b);assert.equal(d.getElementById('drop').nextElementSibling,b);assert.equal(b.querySelectorAll('[data-v261-carregar]').length,2);
 assert.match(b.textContent,/Selecionar SPED Fiscal/);assert.match(b.textContent,/Selecionar EFD Contribuições/);assert.equal(d.getElementById('v261-arquivo').accept,'.txt,text/plain');
 assert.equal(d.querySelector('#drop strong').textContent,'Arraste os XMLs ou a pasta para cá')});
await teste('clicar no menu abre o painel de carga, marca a opção e troca o título',async()=>{
 const b=d.querySelector('[data-v123-key="efdcontrib"]');b.click();await espera(60);assert.ok(d.getElementById('load').classList.contains('active'));assert.ok(b.classList.contains('active'));
 assert.equal(d.querySelector('[data-v123-key="documentos"]').classList.contains('active'),false);assert.equal(d.getElementById('v123-title').textContent,'Carregar EFD Contribuições');
 d.querySelector('[data-v123-key="spedfiscal"]').click();await espera(60);assert.equal(d.getElementById('v123-title').textContent,'Carregar SPED Fiscal (EFD ICMS/IPI)');assert.equal(b.classList.contains('active'),false)});
await teste('menu bloqueado para visitante não abre a carga',async()=>{
 const b=d.querySelector('[data-v123-key="spedfiscal"]');d.getElementById('load').classList.remove('active');b.classList.add('v229-locked');b.click();await espera(60);
 assert.equal(d.getElementById('load').classList.contains('active'),false);b.classList.remove('v229-locked')});
await teste('arquivos .txt vão para a carga; outros tipos são recusados com aviso',()=>{
 const F=n=>new w.File(['|0000|'],n);assert.equal(w.classificadorV261.enviar([F('SPED_11_2026.TXT'),F('nota.xml'),F('efd.txt')]),2);assert.deepEqual([...w.__env[0]],['SPED_11_2026.TXT','efd.txt']);
 assert.match(d.getElementById('v261-sped-msg').textContent,/2 arquivo\(s\) SPED adicionado\(s\)/);assert.equal(w.classificadorV261.enviar([F('nota.xml')]),0);assert.equal(w.__env.length,1);
 assert.match(d.getElementById('v261-sped-msg').textContent,/Nenhum arquivo \.txt/)});
await teste('contagem por tipo: documentos distintos de cada escrituração',()=>{
 const it=[{tipo_documento:'SPED EFD ICMS/IPI',chave_documento:'A',arquivo_origem:'s.txt'},{tipo_documento:'SPED EFD ICMS/IPI',chave_documento:'A',arquivo_origem:'s.txt'},{tipo_documento:'SPED EFD ICMS/IPI',chave_documento:'B',arquivo_origem:'s.txt'},
  {tipo_documento:'SPED EFD Contribuições',chave_documento:'C',arquivo_origem:'c.txt'},{tipo_documento:'NF-e/NFC-e',chave_documento:'D'}];
 const n=w.classificadorV261.contar(it);assert.equal(n.spedfiscal,2);assert.equal(n.efdcontrib,1);
 w.state.items=it;w.classificadorV261.atualizar();assert.equal(d.querySelector('[data-v261-count="spedfiscal"]').textContent,'2');assert.equal(d.querySelector('[data-v261-count="efdcontrib"]').textContent,'1')});
await teste('o leitor da V253 continua reconhecendo os dois arquivos pelo conteúdo',()=>{
 const m=fs.readFileSync(path.join(root,'src/js/modulos/125-v253-painel-fornecedores-impacto.js'),'utf8');assert.ok(m.includes("startsWith('|0000|')"));assert.ok(m.includes("'SPED EFD Contribuições' : 'SPED EFD ICMS/IPI'"))});
await teste('build: selo e título V261, módulo e ícones presentes',()=>{
 const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO 261/);assert.match(dist,/<title>Auditoria Reforma Tributária — V261<\/title>/);assert.ok(dist.includes('V261_CARREGADO')&&dist.includes("spedfiscal:'M6"))});
w.close();console.log(`${ok} testes focados V261 OK`);process.exit(0);
