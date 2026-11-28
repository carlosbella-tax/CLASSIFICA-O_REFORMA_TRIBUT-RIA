/* V280 — Regressão: o relógio do tempo de processamento anda sozinho pela tela, rebate nas bordas,
   continua de onde foi solto depois de arrastado e para/solta com duplo clique. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const ler=n=>fs.readFileSync(path.join(root,'src/js/modulos',n),'utf8');
const m262=ler('133-v262-relogio-movel.js'),m269=ler('139-v269-relogio-flutuante-reinicio.js'),m280=ler('145-v280-relogio-anda-sozinho.js');
const CHAVE='classificador.v262.relogio';
function abrir(gravado){
  const dom=new JSDOM('<html><head></head><body><aside id="v155-timer" class="v155-timer" hidden><small>Tempo de processamento</small><strong>00:00:07</strong><span>x</span></aside></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/',pretendToBeVisual:true}),w=dom.window;
  w.tela={l:1000,a:700};
  Object.defineProperty(w,'innerWidth',{get:()=>w.tela.l,configurable:true});Object.defineProperty(w,'innerHeight',{get:()=>w.tela.a,configurable:true});
  const r=w.document.getElementById('v155-timer');r.getBoundingClientRect=()=>({left:parseFloat(r.style.left)||800,top:parseFloat(r.style.top)||586,width:194,height:90});
  /* os quadros de animação ficam numa fila, para o teste decidir quando o tempo passa */
  w.fila=[];w.requestAnimationFrame=f=>{w.fila.push(f);return w.fila.length};
  if(gravado)w.localStorage.setItem(CHAVE,gravado);
  w.eval(m262);w.eval(m269);w.eval(m280);return w}
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V280: '+n)};
let w=abrir(),d=w.document,r=d.getElementById('v155-timer'),V=w.classificadorV280;
const pos=()=>({x:parseFloat(r.style.left),y:parseFloat(r.style.top)});
const ev=(t,x,y)=>{const e=new w.Event(t,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0});r.dispatchEvent(e)};
const quadro=t=>{const f=w.fila.shift();f(t)};

await teste('módulo carregado depois do arrastar (V262) e da alça (V269); o título explica que o relógio anda sozinho',()=>{
  assert.equal(w.V262_CARREGADO,true);assert.equal(w.V269_CARREGADO,true);assert.equal(w.V280_CARREGADO,true);
  assert.match(r.title,/anda sozinho pela tela/);assert.match(r.getAttribute('aria-label'),/anda sozinho/);assert.equal(w.fila.length,1)});

await teste('relógio oculto não anda',()=>{
  assert.equal(V.passo(1),false);assert.equal(r.style.left,'');assert.equal(V.estado().andando,false)});

await teste('relógio visível sai do canto sozinho: 34 px por segundo na horizontal e 22 na vertical',()=>{
  r.hidden=false;assert.equal(V.estado().andando,true);
  assert.equal(V.passo(1),true);assert.deepEqual(pos(),{x:766,y:564});assert.ok(r.classList.contains('v262-movido'));
  V.passo(0.5);assert.deepEqual(pos(),{x:749,y:553})});

await teste('rebate nas quatro bordas e nunca sai da janela',()=>{
  let minX=1e9,maxX=-1,minY=1e9,maxY=-1,trocasX=0,trocasY=0,ax=V.estado().dx,ay=V.estado().dy;
  for(let i=0;i<3000;i++){V.passo(0.05);const p=pos(),e=V.estado();
    minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);
    if(e.dx!==ax){trocasX++;ax=e.dx}if(e.dy!==ay){trocasY++;ay=e.dy}}
  /* janela de 1000 × 700, relógio de 194 × 90, margem de 6 */
  assert.equal(minX,6);assert.equal(maxX,800);assert.equal(minY,6);assert.equal(maxY,604);
  assert.ok(trocasX>=4,'rebateu na horizontal '+trocasX);assert.ok(trocasY>=4,'rebateu na vertical '+trocasY)});

await teste('o laço de animação move o relógio a cada quadro e não deixa saltar depois de uma pausa longa',()=>{
  quadro(1000);const a=pos();assert.equal(w.fila.length,1);           /* primeiro quadro só marca o tempo */
  quadro(1016);const b=pos();assert.ok(Math.abs(b.x-a.x)>0.4&&Math.abs(b.x-a.x)<0.7,'16 ms ≈ 0,54 px: '+(b.x-a.x));
  quadro(61016);const c=pos();assert.ok(Math.abs(c.x-b.x)<=3.5,'pausa de 60 s anda no máximo 0,1 s: '+(c.x-b.x));assert.equal(w.fila.length,1)});

await teste('arrastar continua valendo: parado enquanto é arrastado e, ao soltar, segue andando de onde ficou',()=>{
  const p=pos();ev('pointerdown',p.x+20,p.y+10);assert.ok(r.classList.contains('v262-arrastando'));
  assert.equal(V.passo(1),false);assert.deepEqual(pos(),p);
  ev('pointermove',320,210);assert.equal(V.passo(1),false);assert.deepEqual(pos(),{x:300,y:200});
  ev('pointerup',320,210);assert.equal(r.classList.contains('v262-arrastando'),false);
  assert.deepEqual(puro(w.classificadorV262.posicao()),{x:300,y:200});
  const e=V.estado();assert.equal(V.passo(1),true);assert.deepEqual(pos(),{x:300+34*e.dx,y:200+22*e.dy})});

await teste('andar sozinho não troca a posição que o usuário escolheu ao arrastar',()=>{
  for(let i=0;i<200;i++)V.passo(0.05);assert.equal(w.localStorage.getItem(CHAVE),'{"x":300,"y":200}')});

await teste('setas do teclado movem o relógio e ele segue andando a partir dali',()=>{
  const p=pos();const k=new w.KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true,cancelable:true});r.dispatchEvent(k);
  assert.equal(pos().x,Math.round(Math.min(800,p.x+20)));const q=pos(),e=V.estado();V.passo(1);
  assert.ok(Math.abs(pos().x-Math.min(800,Math.max(6,q.x+34*e.dx)))<0.11)});

await teste('duplo clique para o relógio no canto; outro duplo clique solta de novo',()=>{
  r.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true}));
  assert.equal(V.estado().parado,true);assert.ok(r.classList.contains('v280-parado'));assert.equal(r.style.left,'');assert.equal(r.classList.contains('v262-movido'),false);
  assert.equal(d.querySelector('#v269-alca em').textContent,'relógio parado');
  assert.equal(V.passo(1),false);assert.equal(r.style.left,'');assert.equal(w.localStorage.getItem(CHAVE),null);
  r.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true}));
  assert.equal(V.estado().parado,false);assert.equal(r.classList.contains('v280-parado'),false);assert.equal(d.querySelector('#v269-alca em').textContent,'arraste para mover');
  assert.equal(V.passo(1),true);const p=pos();assert.ok(p.x>=6&&p.x<=800&&p.y>=6&&p.y<=604);assert.notDeepEqual(p,{x:800,y:586})});

await teste('janela menor: o relógio volta para dentro da área visível e continua andando',()=>{
  for(let i=0;i<400&&pos().x<700;i++)V.passo(0.2);assert.ok(pos().x>=600,'chegou perto da borda direita: '+pos().x);
  w.tela.l=500;w.tela.a=400;w.dispatchEvent(new w.Event('resize'));
  assert.ok(pos().x<=300,'x dentro de 500 px: '+pos().x);assert.ok(pos().y<=304,'y dentro de 400 px: '+pos().y);
  for(let i=0;i<500;i++){V.passo(0.05);const p=pos();assert.ok(p.x>=6&&p.x<=300&&p.y>=6&&p.y<=304)}});

await teste('relógio com posição gravada: aparece no lugar gravado e anda a partir dele',()=>{
  w.close();w=abrir('{"x":120,"y":80}');d=w.document;r=d.getElementById('v155-timer');V=w.classificadorV280;
  assert.equal(r.style.left,'120px');r.hidden=false;const e=V.estado();V.passo(1);
  assert.deepEqual(pos(),{x:120+34*e.dx,y:80+22*e.dy});assert.equal(w.localStorage.getItem(CHAVE),'{"x":120,"y":80}')});

await teste('não entra na impressão e o build traz o módulo na versão nova',()=>{
  assert.match(m262,/@media print\{#v155-timer\{display:none!important\}\}/);
  const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);
  assert.ok(dist.includes('V280_CARREGADO'));assert.ok(dist.indexOf('V280_CARREGADO')>dist.indexOf('V269_CARREGADO'))});
function puro(x){return JSON.parse(JSON.stringify(x))}
w.close();console.log(ok+' testes V280 OK');process.exit(0);
