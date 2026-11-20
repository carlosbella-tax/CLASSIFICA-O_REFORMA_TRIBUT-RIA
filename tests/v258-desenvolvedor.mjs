/* V258 — Regressão do crédito fixo do desenvolvedor: aparece no menu, no acesso e na Administração,
   volta sozinho quando removido, escondido ou adulterado, e não há comando para alterá-lo. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/129-v258-desenvolvedor.js'),'utf8');
const dom=new JSDOM('<html><head></head><body><aside id="v123-sidebar"><button class="v123-link">Consulta</button></aside><section id="v229-auth"><div class="v229-card"><h2>Acesso</h2></div></section><section id="v235-admin-aba"><div class="v229-card"><h2>Administração</h2></div></section></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window,d=w.document;
w.eval(src);let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V258: '+n)};const espera=()=>new Promise(r=>setTimeout(r,20));
const blocos=()=>[...d.querySelectorAll('.v258-dev')];const txt=el=>el.textContent.replace(/\s+/g,' ');
await teste('aparece no menu, na tela de acesso e na Administração, com nome e telefone',()=>{assert.equal(blocos().length,3);for(const b of blocos()){assert.match(txt(b),/Desenvolvedor/);assert.match(txt(b),/Carlos Bella/);assert.match(txt(b),/\+55 11 99479-7347/)}
 assert.equal(d.querySelector('#v123-sidebar').lastElementChild.className,'v258-dev');assert.equal(d.querySelector('.v258-dev a').getAttribute('href'),'tel:+5511994797347')});
await teste('removido da página: volta sozinho',async()=>{blocos().forEach(b=>b.remove());assert.equal(blocos().length,0);await espera();assert.equal(blocos().length,3)});
await teste('texto adulterado: é restaurado',async()=>{const b=d.querySelector('#v123-sidebar .v258-dev');b.innerHTML='<b>Outro Nome</b>';await espera();assert.match(txt(d.querySelector('#v123-sidebar .v258-dev')),/Carlos Bella/);assert.doesNotMatch(d.querySelector('#v123-sidebar').textContent,/Outro Nome/);
 d.querySelector('#v123-sidebar .v258-dev b').firstChild.data='X';await espera();assert.match(txt(d.querySelector('#v123-sidebar .v258-dev')),/Carlos Bella/)});
await teste('escondido por estilo, atributo ou troca de classe: volta a aparecer',async()=>{const b=d.querySelector('#v123-sidebar .v258-dev');b.style.display='none';b.hidden=true;await espera();assert.equal(b.getAttribute('style'),null);assert.equal(b.hidden,false);
 b.className='oculto';await espera();assert.equal(d.querySelectorAll('#v123-sidebar .v258-dev').length,1)});
await teste('tela recriada (conteúdo do cartão substituído): o crédito reaparece, sem duplicar',async()=>{d.querySelector('#v235-admin-aba .v229-card').innerHTML='<h2>Nova</h2>';await espera();assert.equal(d.querySelectorAll('#v235-admin-aba .v258-dev').length,1);
 d.querySelector('#v123-sidebar').appendChild(d.createElement('button'));await espera();assert.equal(d.querySelector('#v123-sidebar').lastElementChild.className,'v258-dev');assert.equal(blocos().length,3)});
await teste('folha de estilo removida: é recolocada',async()=>{d.getElementById('v258-desenvolvedor-style').remove();d.body.appendChild(d.createElement('i'));await espera();assert.ok(d.getElementById('v258-desenvolvedor-style'))});
await teste('não há comando para alterar: objeto congelado e sem gravação em navegador ou servidor',()=>{w.eval('try{window.classificadorV258.texto="x"}catch(e){};try{window.classificadorV258=null}catch(e){};try{window.V258_CARREGADO=false}catch(e){}');
 assert.match(w.classificadorV258.texto,/Carlos Bella/);assert.equal(w.V258_CARREGADO,true);assert.doesNotMatch(src,/localStorage|sessionStorage|fetch\(|supabase|contenteditable/i)});
await teste('build: selo e título V258 e crédito presente',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO 258/);assert.match(dist,/<title>Auditoria Reforma Tributária — V258<\/title>/);assert.ok(dist.includes('V258_CARREGADO'));assert.ok(dist.includes('+55 11 99479-7347'))});
w.close();console.log(`${ok} testes focados V258 OK`);process.exit(0);
