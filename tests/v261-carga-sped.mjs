/* V261/V263 — Regressão: SPED Fiscal e EFD Contribuições no menu Documentos, cada um com a sua tela de carga
   (arquivo ou pasta), sem o quadro Carregar XML/PDF; e a tela de XML sem os quadros do SPED. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/132-v261-carga-sped-efd.js'),'utf8');
const html='<html><head></head><body><aside id="v123-sidebar"><button class="v123-link" data-v123-key="documentos" data-v123-tab="load">Carregar XML/PDF<small>0</small></button><button class="v123-link" data-v123-key="nfe">NF-e<small>0</small></button><button class="v123-link" data-v123-key="cte">CT-e<small>0</small></button><button class="v123-link" data-v123-key="ibs">Base<small>0</small></button></aside><div id="v123-title">x</div><main class="wrap"><section id="load" class="panel"><div class="card"><h2 id="v225-carregar-titulo">Carregar XML/PDF</h2><div id="drop"><strong>Arraste os XMLs ou a pasta para cá</strong><input id="files" type="file" multiple hidden></div><button id="process">Processar</button></div></section><section id="ibscbs" class="panel"><button id="maisXml">Carregar mais XMLs</button></section></main></body></html>';
const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://teste.invalid/',pretendToBeVisual:true}),w=dom.window,d=w.document;
w.eval('var state={items:[]};window.__env=[];window.classificadorV261Enviar=a=>{window.__env.push(a.map(f=>f.name))};');
const load=d.getElementById('load');
d.querySelector('[data-v123-key="documentos"]').addEventListener('click',()=>{load.classList.add('active')});
d.querySelector('[data-v123-key="ibs"]').addEventListener('click',()=>{load.classList.remove('active')});
w.eval(src);
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V261: '+n)};const espera=ms=>new Promise(r=>setTimeout(r,ms));
const visivel=id=>w.getComputedStyle(d.getElementById(id)).display!=='none';
await teste('menu Documentos tem SPED Fiscal e EFD Contribuições logo depois do CT-e',()=>{
 const k=[...d.querySelectorAll('#v123-sidebar .v123-link')].map(x=>x.dataset.v123Key);assert.deepEqual(k,['documentos','nfe','cte','spedfiscal','efdcontrib','ibs']);
 assert.match(d.querySelector('[data-v123-key="spedfiscal"]').textContent,/SPED Fiscal — EFD ICMS\/IPI0/);assert.match(d.querySelector('[data-v123-key="efdcontrib"]').textContent,/EFD Contribuições0/)});
await teste('tela Carregar XML/PDF não mostra nenhum quadro do SPED',()=>{
 assert.equal(load.dataset.v263Modo,'xml');assert.equal(visivel('v261-sped-spedfiscal'),false);assert.equal(visivel('v261-sped-efdcontrib'),false);assert.equal(visivel('drop'),true);assert.equal(visivel('v225-carregar-titulo'),true);
 assert.equal(d.querySelector('#drop strong').textContent,'Arraste os XMLs ou a pasta para cá')});
await teste('tela SPED Fiscal: só o SPED Fiscal, com Selecionar arquivo e Selecionar pasta, sem o quadro de XML',async()=>{
 const b=d.querySelector('[data-v123-key="spedfiscal"]');b.click();await espera(60);assert.ok(load.classList.contains('active'));assert.equal(load.dataset.v263Modo,'spedfiscal');
 assert.equal(visivel('v261-sped-spedfiscal'),true);assert.equal(visivel('v261-sped-efdcontrib'),false);assert.equal(visivel('drop'),false);assert.equal(visivel('v225-carregar-titulo'),false);
 const q=d.getElementById('v261-sped-spedfiscal');assert.equal(q.querySelector('h2').textContent,'Carregar SPED Fiscal (EFD ICMS/IPI)');assert.equal(q.querySelector('[data-v261-arquivo]').textContent,'Selecionar arquivo');assert.equal(q.querySelector('[data-v261-pasta]').textContent,'Selecionar pasta');
 assert.doesNotMatch(q.textContent,/XML|Contribuições/);assert.equal(d.getElementById('v261-arquivo-spedfiscal').accept,'.txt,text/plain');assert.ok(d.getElementById('v261-pasta-spedfiscal').hasAttribute('webkitdirectory'));
 assert.ok(b.classList.contains('active'));assert.equal(d.querySelector('[data-v123-key="documentos"]').classList.contains('active'),false);assert.equal(d.getElementById('v123-title').textContent,'Carregar SPED Fiscal (EFD ICMS/IPI)');assert.equal(visivel('process'),true)});
await teste('tela EFD Contribuições: só a EFD Contribuições, sem SPED Fiscal e sem o quadro de XML',async()=>{
 d.querySelector('[data-v123-key="efdcontrib"]').click();await espera(60);assert.equal(load.dataset.v263Modo,'efdcontrib');
 assert.equal(visivel('v261-sped-efdcontrib'),true);assert.equal(visivel('v261-sped-spedfiscal'),false);assert.equal(visivel('drop'),false);
 const q=d.getElementById('v261-sped-efdcontrib');assert.equal(q.querySelector('h2').textContent,'Carregar EFD Contribuições');assert.doesNotMatch(q.textContent,/XML|SPED Fiscal|ICMS/);assert.ok(q.querySelector('[data-v261-pasta]'));
 assert.equal(d.getElementById('v123-title').textContent,'Carregar EFD Contribuições');assert.equal(d.querySelector('[data-v123-key="spedfiscal"]').classList.contains('active'),false)});
await teste('clicar dentro da tela de carga mantém o modo; voltar pelo menu Carregar XML/PDF ou por outra tela restaura o XML',async()=>{
 d.getElementById('process').click();assert.equal(load.dataset.v263Modo,'efdcontrib');
 d.querySelector('[data-v123-key="documentos"]').click();assert.equal(load.dataset.v263Modo,'xml');assert.equal(visivel('drop'),true);assert.equal(visivel('v261-sped-efdcontrib'),false);
 d.querySelector('[data-v123-key="spedfiscal"]').click();await espera(60);d.querySelector('[data-v123-key="ibs"]').click();d.getElementById('maisXml').click();assert.equal(load.dataset.v263Modo,'xml')});
await teste('menu bloqueado para visitante não abre a carga nem troca o modo',async()=>{
 const b=d.querySelector('[data-v123-key="spedfiscal"]');load.classList.remove('active');b.classList.add('v229-locked');b.click();await espera(60);
 assert.equal(load.classList.contains('active'),false);assert.equal(load.dataset.v263Modo,'xml');b.classList.remove('v229-locked')});
await teste('arquivo e pasta: só os .txt vão para a carga, com aviso na tela da própria escrituração',()=>{
 const F=n=>new w.File(['|0000|'],n);assert.equal(w.classificadorV261.enviar([F('SPED_11_2026.TXT'),F('nota.xml'),F('leia.pdf'),F('efd.txt')],'spedfiscal'),2);assert.deepEqual([...w.__env[0]],['SPED_11_2026.TXT','efd.txt']);
 assert.match(d.getElementById('v261-msg-spedfiscal').textContent,/2 arquivo\(s\) adicionado\(s\) à carga/);assert.equal(d.getElementById('v261-msg-efdcontrib').textContent,'');
 assert.equal(w.classificadorV261.enviar([F('nota.xml')],'efdcontrib'),0);assert.equal(w.__env.length,1);assert.match(d.getElementById('v261-msg-efdcontrib').textContent,/Nenhum arquivo \.txt encontrado.*EFD Contribuições/);
 assert.equal(w.classificadorV261.enviar([],'efdcontrib'),0);assert.match(d.getElementById('v261-msg-efdcontrib').textContent,/Nenhum arquivo selecionado/)});
await teste('arrastar o arquivo para o quadro da escrituração adiciona à carga',()=>{
 const z=d.querySelector('[data-v261-zona="efdcontrib"]'),e=new w.Event('drop',{bubbles:true,cancelable:true});e.dataTransfer={files:[new w.File(['|0000|'],'EFD_CONTRIB.txt')]};z.dispatchEvent(e);
 assert.deepEqual([...w.__env[w.__env.length-1]],['EFD_CONTRIB.txt']);assert.ok(e.defaultPrevented)});
await teste('contagem por tipo: documentos distintos de cada escrituração',()=>{
 const it=[{tipo_documento:'SPED EFD ICMS/IPI',chave_documento:'A',arquivo_origem:'s.txt'},{tipo_documento:'SPED EFD ICMS/IPI',chave_documento:'A',arquivo_origem:'s.txt'},{tipo_documento:'SPED EFD ICMS/IPI',chave_documento:'B',arquivo_origem:'s.txt'},
  {tipo_documento:'SPED EFD Contribuições',chave_documento:'C',arquivo_origem:'c.txt'},{tipo_documento:'NF-e/NFC-e',chave_documento:'D'}];
 const n=w.classificadorV261.contar(it);assert.equal(n.spedfiscal,2);assert.equal(n.efdcontrib,1);
 w.state.items=it;w.classificadorV261.atualizar();assert.equal(d.querySelector('[data-v261-count="spedfiscal"]').textContent,'2');assert.equal(d.querySelector('[data-v261-count="efdcontrib"]').textContent,'1')});
await teste('o leitor da V253 continua reconhecendo os dois arquivos pelo conteúdo',()=>{
 const m=fs.readFileSync(path.join(root,'src/js/modulos/125-v253-painel-fornecedores-impacto.js'),'utf8');assert.ok(m.includes("startsWith('|0000|')"));assert.ok(m.includes("'SPED EFD Contribuições' : 'SPED EFD ICMS/IPI'"))});
await teste('build: selo e título da versão, módulo e ícones presentes',()=>{
 const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO \d+/);assert.match(dist,/<title>Auditoria Reforma Tributária — V263<\/title>/);assert.ok(dist.includes('V261_CARREGADO')&&dist.includes('data-v263-modo')&&dist.includes("spedfiscal:'M6"))});
w.close();console.log(`${ok} testes focados V261/V263 OK`);process.exit(0);
