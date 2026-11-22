/* V266 — Regressão: barra de rolagem horizontal flutuante quando a barra da tabela está fora da tela. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/136-v266-rolagem-horizontal-flutuante.js'),'utf8');
const dom=new JSDOM('<html><head></head><body><section id="a" class="panel active"><div class="v180-scroll" id="t1" style="overflow-x:auto"></div><div class="table-wrap" id="t2" style="overflow-x:auto"></div><div id="t4" style="overflow-x:hidden"></div></section><section id="b" class="panel"><div class="table-wrap" id="t3" style="overflow-x:auto"></div></section></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/',pretendToBeVisual:true}),w=dom.window,d=w.document;
Object.defineProperty(w,'innerHeight',{value:800,configurable:true});
const medidas={t1:{top:100,bottom:1500,left:300,cw:1000,sw:2400},t2:{top:1600,bottom:2000,left:300,cw:1000,sw:1800},t3:{top:100,bottom:1500,left:300,cw:1000,sw:2400},t4:{top:100,bottom:1500,left:300,cw:1000,sw:5000}};
for(const id in medidas){const e=d.getElementById(id);e.getBoundingClientRect=()=>({top:medidas[id].top,bottom:medidas[id].bottom,left:medidas[id].left});
 Object.defineProperty(e,'clientWidth',{get:()=>medidas[id].cw});Object.defineProperty(e,'scrollWidth',{get:()=>medidas[id].sw})}
w.eval(src);const A=w.classificadorV266,barra=d.getElementById('v266-barra'),cursor=d.getElementById('v266-cursor');barra.getBoundingClientRect=()=>({left:300,top:780});
const ev=(t,x)=>{const e=new w.Event(t,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,pointerId:1,button:0});barra.dispatchEvent(e)};
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V266: '+n)};
await teste('regra: só aparece quando há rolagem lateral, a tabela está na tela e a barra dela está abaixo da janela',()=>{
 assert.equal(A.precisa({topo:100,fim:1500,largura:1000,conteudo:2400},800),true);assert.equal(A.precisa({topo:100,fim:700,largura:1000,conteudo:2400},800),false);
 assert.equal(A.precisa({topo:100,fim:1500,largura:1000,conteudo:1002},800),false);assert.equal(A.precisa({topo:900,fim:1500,largura:1000,conteudo:2400},800),false);
 assert.equal(A.precisa({topo:-900,fim:30,largura:1000,conteudo:2400},800),false);assert.equal(A.precisa({topo:-500,fim:1500,largura:1000,conteudo:2400},800),true);assert.equal(A.precisa(null,800),false)});
await teste('cursor proporcional à parte visível, com tamanho mínimo, e conversão de posição em rolagem',()=>{
 const g=A.geometria(1000,2400,0,1000);assert.equal(g.tam,417);assert.equal(g.curso,583);assert.equal(g.max,1400);assert.equal(g.pos,0);assert.equal(A.geometria(1000,2400,1400,1000).pos,583);assert.equal(A.geometria(1000,2400,700,1000).pos,292);
 assert.equal(A.geometria(1000,90000,0,1000).tam,44);assert.equal(A.rolagemDe(583,g),1400);assert.equal(A.rolagemDe(-50,g),0);assert.equal(A.rolagemDe(9999,g),1400)});
await teste('tabela larga com o fim abaixo da tela: barra flutuante na mesma posição e largura da tabela',()=>{A.atualizar();assert.equal(barra.hidden,false);assert.equal(A.alvo().id,'t1');assert.equal(barra.style.left,'300px');assert.equal(barra.style.width,'1000px');assert.equal(cursor.style.width,'417px');assert.equal(cursor.style.left,'0px')});
await teste('arrastar o cursor da barra flutuante rola a tabela, sem passar do fim',()=>{const t=d.getElementById('t1');ev('pointerdown',400);assert.ok(barra.classList.contains('v266-arrastando'));ev('pointermove',700);assert.equal(t.scrollLeft,720);assert.equal(cursor.style.left,'300px');
 ev('pointermove',5000);assert.equal(t.scrollLeft,1400);ev('pointerup',5000);assert.equal(barra.classList.contains('v266-arrastando'),false);ev('pointermove',300);assert.equal(t.scrollLeft,1400)});
await teste('clicar no trilho leva o cursor até o ponto clicado',()=>{const t=d.getElementById('t1');ev('pointerdown',300+208);ev('pointerup',508);assert.equal(t.scrollLeft,0);ev('pointerdown',300+500);ev('pointerup',800);assert.equal(t.scrollLeft,Math.round((500-208.5)/583*1400))});
await teste('rolar a tabela (roda do mouse, teclado) move o cursor da barra flutuante',()=>{const t=d.getElementById('t1');t.scrollLeft=700;t.dispatchEvent(new w.Event('scroll'));assert.equal(cursor.style.left,'292px')});
await teste('quando a barra da própria tabela entra na tela, a flutuante some',()=>{medidas.t1.top=-800;medidas.t1.bottom=600;medidas.t2.top=700;medidas.t2.bottom=1100;A.atualizar();assert.equal(A.alvo().id,'t2');
 medidas.t2.top=300;medidas.t2.bottom=700;A.atualizar();assert.equal(barra.hidden,true);assert.equal(A.alvo(),null)});
await teste('só a tela aberta conta; ao trocar de tela a barra acompanha; área sem rolagem lateral é ignorada',()=>{d.getElementById('a').classList.remove('active');d.getElementById('b').classList.add('active');A.atualizar();assert.equal(barra.hidden,false);assert.equal(A.alvo().id,'t3');
 medidas.t3.sw=1000;A.atualizar();assert.equal(barra.hidden,true)});
await teste('não altera dados; fica fora da impressão; build com a versão',()=>{assert.doesNotMatch(src,/state\.|fetch\(|localStorage/);assert.match(src,/@media print\{#v266-barra\{display:none!important\}\}/);
 const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/);assert.ok(dist.includes('V266_CARREGADO'))});
w.close();console.log(`${ok} testes focados V266 OK`);process.exit(0);
