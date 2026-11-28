/* V281 — Regressão: com a tela rolada o relógio se recolhe na barra do título (não cobre o conteúdo);
   no topo da página volta a andar. Recolhido, não é arrastado. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const ler=n=>fs.readFileSync(path.join(root,'src/js/modulos',n),'utf8');
const m262=ler('133-v262-relogio-movel.js'),m269=ler('139-v269-relogio-flutuante-reinicio.js'),m280=ler('145-v280-relogio-anda-sozinho.js'),m281=ler('146-v281-relogio-recolhe-ao-rolar.js');
const dom=new JSDOM('<html><head></head><body><div id="v123-sidebar"><div id="menuRol"></div></div><div id="v123-topbar"><div class="v123-page-title" id="v123-title">Tela</div></div>'+
  '<section class="panel active" id="pA"><div class="table-wrap" id="qA"></div><div class="v273-wrap" id="qOutro"></div><textarea id="txt"></textarea></section>'+
  '<section class="panel" id="pB"><div class="table-wrap" id="qB"></div></section>'+
  '<aside id="v155-timer" class="v155-timer" hidden><small>Tempo de processamento</small><strong>00:00:07</strong><span>x</span></aside></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/',pretendToBeVisual:true}),w=dom.window,d=w.document;
w.rolagem=0;Object.defineProperty(w,'scrollY',{get:()=>w.rolagem,configurable:true});Object.defineProperty(w,'pageYOffset',{get:()=>w.rolagem,configurable:true});
Object.defineProperty(w,'innerWidth',{value:1000,configurable:true});Object.defineProperty(w,'innerHeight',{value:700,configurable:true});
const r=d.getElementById('v155-timer');r.getBoundingClientRect=()=>({left:parseFloat(r.style.left)||800,top:parseFloat(r.style.top)||586,width:r.classList.contains('v281-recolhido')?165:194,height:r.classList.contains('v281-recolhido')?46:90});
d.getElementById('v123-topbar').getBoundingClientRect=()=>({left:255,top:0,width:745,height:88,right:1000,bottom:88});
w.fila=[];w.requestAnimationFrame=f=>{w.fila.push(f);return w.fila.length};
w.eval(m262);w.eval(m269);w.eval(m280);w.eval(m281);
const V=w.classificadorV281,V280=w.classificadorV280;
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V281: '+n)};
const rolarPagina=y=>{w.rolagem=y;w.dispatchEvent(new w.Event('scroll'))};
const rolarQuadro=(id,y)=>{const q=d.getElementById(id);q.scrollTop=y;q.dispatchEvent(new w.Event('scroll'));return q};
const ev=(t,x,y)=>{const e=new w.Event(t,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:1,button:0});r.dispatchEvent(e)};
const rec=()=>r.classList.contains('v281-recolhido');

await teste('módulo carregado depois do passeio (V280); relógio oculto não se recolhe mesmo com a tela rolada',()=>{
  assert.equal(w.V280_CARREGADO,true);assert.equal(w.V281_CARREGADO,true);rolarPagina(600);
  assert.equal(rec(),false);assert.equal(d.body.classList.contains('v281-relogio-recolhido'),false);rolarPagina(0)});

await teste('no topo da página o relógio fica solto e anda pela tela',()=>{
  r.hidden=false;assert.equal(V.avaliar(),false);assert.equal(rec(),false);
  assert.equal(V280.passo(1),true);assert.equal(parseFloat(r.style.left),766);assert.match(r.title,/anda sozinho/)});

await teste('ao descer a tela ele se recolhe na barra do título, que reserva o espaço dele',()=>{
  rolarPagina(300);assert.equal(rec(),true);assert.equal(V.recolhido(),true);assert.ok(d.body.classList.contains('v281-relogio-recolhido'));
  /* barra de 88 px, relógio compacto de 46 px: centrado na vertical */
  assert.equal(r.style.getPropertyValue('--v281-topo'),'21px');assert.equal(d.body.style.getPropertyValue('--v281-larg'),'165px');
  assert.match(r.title,/recolhido na barra do título/)});

await teste('recolhido, o relógio para de andar e continua mostrando o tempo',()=>{
  const antes=r.style.left;assert.equal(V280.passo(1),false);assert.equal(r.style.left,antes);assert.equal(V280.estado().andando,false);
  assert.equal(r.querySelector('strong').textContent,'00:00:07')});

await teste('recolhido, não é arrastado, não anda pelas setas e o duplo clique não o solta',()=>{
  const antes=r.style.left;ev('pointerdown',810,596);assert.equal(r.classList.contains('v262-arrastando'),false);ev('pointermove',300,200);ev('pointerup',300,200);assert.equal(r.style.left,antes);
  r.dispatchEvent(new w.KeyboardEvent('keydown',{key:'ArrowLeft',bubbles:true,cancelable:true}));assert.equal(r.style.left,antes);
  r.dispatchEvent(new w.MouseEvent('dblclick',{bubbles:true}));assert.equal(V280.estado().parado,false);assert.equal(rec(),true)});

await teste('rolagem pequena (até 4 px) não recolhe; de volta ao topo ele se solta e segue andando de onde estava',()=>{
  rolarPagina(4);assert.equal(rec(),false);rolarPagina(5);assert.equal(rec(),true);
  rolarPagina(0);assert.equal(rec(),false);assert.equal(d.body.classList.contains('v281-relogio-recolhido'),false);assert.match(r.title,/anda sozinho/);
  const antes=r.getBoundingClientRect().left;assert.equal(V280.passo(1),true);assert.equal(Math.abs(parseFloat(r.style.left)-antes),34)});

await teste('arrastar volta a funcionar com a página no topo',()=>{
  ev('pointerdown',parseFloat(r.style.left)+10,parseFloat(r.style.top)+10);assert.ok(r.classList.contains('v262-arrastando'));ev('pointermove',410,310);ev('pointerup',410,310);
  assert.equal(r.style.left,'400px');assert.equal(r.style.top,'300px')});

await teste('rolar o quadro de uma tabela da tela aberta também recolhe; voltar ao início da tabela solta',()=>{
  rolarQuadro('qA',80);assert.equal(rec(),true);rolarQuadro('qA',0);assert.equal(rec(),false)});

await teste('qualquer quadro interno rolado conta (não só os de tabela principal)',()=>{
  rolarQuadro('qOutro',50);assert.equal(rec(),true);rolarQuadro('qOutro',0);assert.equal(rec(),false)});

await teste('quadro rolado de uma tela que não está aberta não recolhe; ao abrir essa tela, recolhe',()=>{
  rolarQuadro('qB',120);assert.equal(rec(),false);
  d.getElementById('pA').classList.remove('active');d.getElementById('pB').classList.add('active');assert.equal(V.avaliar(),true);
  d.getElementById('pB').classList.remove('active');d.getElementById('pA').classList.add('active');assert.equal(V.avaliar(),false);rolarQuadro('qB',0)});

await teste('rolar o menu lateral ou um campo de texto não recolhe o relógio',()=>{
  rolarQuadro('menuRol',200);assert.equal(rec(),false);rolarQuadro('txt',90);assert.equal(rec(),false)});

await teste('relógio some com a tela rolada: a barra do título devolve o espaço; ao reaparecer, já vem recolhido',()=>{
  rolarPagina(400);assert.equal(rec(),true);r.hidden=true;assert.equal(V.avaliar(),false);assert.equal(d.body.classList.contains('v281-relogio-recolhido'),false);
  r.hidden=false;assert.equal(V.avaliar(),true);assert.ok(d.body.classList.contains('v281-relogio-recolhido'));rolarPagina(0)});

await teste('camadas: barra do título e menu ficam acima dos cabeçalhos de tabela e abaixo da barra de rolagem flutuante',()=>{
  const css=d.getElementById('v281-relogio-style').textContent,z=s=>Number(new RegExp(s.replace(/[.#]/g,'\\$&')+'\\{z-index:(\\d+)!important').exec(css)[1]);
  const estilo=fs.readFileSync(path.join(root,'src/css/estilo.css'),'utf8');
  const maiorCabecalho=Math.max(...[...estilo.matchAll(/(?:thead th|\.horizontal-scroll|\.excel-filter-flag)\{[^}]*?z-index:(\d+)/g)].map(m=>Number(m[1])));
  assert.equal(maiorCabecalho,60);
  const barra=z('html body #v123-topbar'),menu=z('html body #v123-sidebar'),dev=z('html body .v258-dev'),marca=z('html body .v123-header .brand'),botao=z('html body #v260-toggle');
  assert.ok(barra>maiorCabecalho&&barra<menu&&menu<dev&&dev<marca&&marca<botao&&botao<90,[barra,menu,dev,marca,botao].join(' '));
  assert.match(ler('136-v266-rolagem-horizontal-flutuante.js'),/#v266-barra\{position:fixed;bottom:0;z-index:90/)});

await teste('formato compacto: sem a alça e sem o rótulo; não entra na impressão; build na versão nova',()=>{
  const css=d.getElementById('v281-relogio-style').textContent;
  assert.match(css,/#v155-timer\.v281-recolhido #v269-alca,#v155-timer\.v281-recolhido small\{display:none!important\}/);
  assert.match(css,/body\.v281-relogio-recolhido #v123-topbar\{padding-right:calc\(var\(--v281-larg,170px\) \+ 32px\)!important\}/);
  assert.match(m262,/@media print\{#v155-timer\{display:none!important\}\}/);
  const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);
  assert.ok(dist.includes('V281_CARREGADO'));assert.ok(dist.indexOf('V281_CARREGADO')>dist.indexOf('V280_CARREGADO'))});
w.close();console.log(ok+' testes V281 OK');process.exit(0);
