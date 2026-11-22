/* V262 — Regressão: relógio do tempo de processamento pode ser arrastado, fica dentro da tela e lembra a posição. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/133-v262-relogio-movel.js'),'utf8');
function abrir(gravado){const dom=new JSDOM('<html><head></head><body><aside id="v155-timer" class="v155-timer" hidden><small>Tempo de processamento</small><strong>00:00:07</strong><span>x</span></aside></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/',pretendToBeVisual:true}),w=dom.window;
 Object.defineProperty(w,'innerWidth',{value:1000,configurable:true});Object.defineProperty(w,'innerHeight',{value:700,configurable:true});
 const r=w.document.getElementById('v155-timer');r.getBoundingClientRect=()=>({left:parseFloat(r.style.left)||800,top:parseFloat(r.style.top)||586,width:194,height:90});
 if(gravado)w.localStorage.setItem('classificador.v262.relogio',gravado);w.eval(src);return w}
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V262: '+n)};
let w=abrir(),d=w.document,r=d.getElementById('v155-timer');
const ev=(t,x,y)=>{const e=new w.Event(t,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0});r.dispatchEvent(e)};
await teste('sem posição gravada o relógio continua no canto inferior direito',()=>{assert.equal(r.classList.contains('v262-movido'),false);assert.equal(r.style.left,'');assert.equal(w.classificadorV262.posicao(),null);assert.match(r.title,/Arraste/)});
await teste('arrastar move o relógio para onde o usuário soltar',()=>{ev('pointerdown',810,596);assert.ok(r.classList.contains('v262-arrastando'));ev('pointermove',310,196);ev('pointerup',310,196);
 assert.equal(r.style.left,'300px');assert.equal(r.style.top,'186px');assert.ok(r.classList.contains('v262-movido'));assert.equal(r.classList.contains('v262-arrastando'),false)});
await teste('a posição fica gravada e volta na próxima abertura',()=>{assert.deepEqual(JSON.parse(w.localStorage.getItem('classificador.v262.relogio')),{x:300,y:186});
 const w2=abrir('{"x":120,"y":80}'),r2=w2.document.getElementById('v155-timer');assert.equal(r2.style.left,'120px');assert.equal(r2.style.top,'80px');w2.close()});
await teste('o relógio nunca sai da tela, nem por arrasto nem por posição gravada inválida',()=>{ev('pointerdown',310,196);ev('pointermove',5000,-900);ev('pointerup',5000,-900);assert.equal(r.style.left,'800px');assert.equal(r.style.top,'6px');
 const w2=abrir('{"x":9999,"y":9999}'),r2=w2.document.getElementById('v155-timer');assert.equal(r2.style.left,'800px');assert.equal(r2.style.top,'604px');w2.close();
 const w3=abrir('lixo'),r3=w3.document.getElementById('v155-timer');assert.equal(r3.style.left,'');w3.close()});
await teste('movimento sem ter pressionado o relógio não o desloca; botão direito não arrasta',()=>{const a=r.style.left;ev('pointermove',100,100);assert.equal(r.style.left,a);
 const e=new w.Event('pointerdown',{bubbles:true,cancelable:true});Object.assign(e,{clientX:10,clientY:10,pointerId:2,button:2});r.dispatchEvent(e);assert.equal(r.classList.contains('v262-arrastando'),false)});
await teste('teclado: setas movem 20 px e Home devolve ao canto',()=>{w.classificadorV262.mover(300,200);const k=key=>r.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
 k('ArrowRight');k('ArrowDown');assert.equal(r.style.left,'320px');assert.equal(r.style.top,'220px');k('Home');assert.equal(r.style.left,'');assert.equal(w.localStorage.getItem('classificador.v262.relogio'),null)});
await teste('duplo clique devolve ao canto inferior direito',()=>{w.classificadorV262.mover(50,50);assert.ok(r.classList.contains('v262-movido'));r.dispatchEvent(new w.Event('dblclick',{bubbles:true}));assert.equal(r.classList.contains('v262-movido'),false);assert.equal(w.classificadorV262.posicao(),null)});
await teste('janela redimensionada: o relógio é trazido de volta para dentro',()=>{w.classificadorV262.mover(780,580);Object.defineProperty(w,'innerWidth',{value:500,configurable:true});Object.defineProperty(w,'innerHeight',{value:300,configurable:true});w.dispatchEvent(new w.Event('resize'));assert.equal(r.style.left,'300px');assert.equal(r.style.top,'204px')});
await teste('não mexe na contagem do tempo',()=>{assert.equal(r.querySelector('strong').textContent,'00:00:07');assert.doesNotMatch(src,/querySelector\('strong'\)|setInterval|performance\.now/)});
await teste('build: selo e título V262 e módulo presente',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO 262/);assert.match(dist,/<title>Auditoria Reforma Tributária — V262<\/title>/);assert.ok(dist.includes('V262_CARREGADO'))});
w.close();console.log(`${ok} testes focados V262 OK`);process.exit(0);
