/* V260 — Regressão do layout: menu recolhível com preferência gravada, ícones, menu em janela estreita
   e indicadores no topo das telas de análise. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/131-v260-menu-recolhivel-indicadores.js'),'utf8');
const html='<html><head></head><body><aside id="v123-sidebar"><div class="brand">TaxAdvice</div><div class="v123-side-section">Análise</div><button class="v123-link" data-v123-key="consulta">Consulta NCM e NBS<small>0</small></button><button class="v123-link" data-v123-key="apuracaocbs">Apuração assistida da CBS<small>0</small></button><button class="v123-link v229-locked" data-v123-key="dashboard" title="Acesso completo após entrar com cadastro">Dashboard<small>0</small></button><button class="v123-link" data-v123-key="novo">Outro<small>0</small></button></aside><div id="v123-topbar"></div><main class="wrap"><section id="load" class="panel active"></section><section id="dashboard" class="panel"></section><section id="items" class="panel"></section></main></body></html>';
function abrir(estreita,pref){const dom=new JSDOM(html,{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;
 w.matchMedia=()=>({matches:estreita,addEventListener(){},addListener(){}});if(pref)w.localStorage.setItem('classificador.v260.menu',pref);
 w.eval('var state={items:[]};function num(v){let x=String(v??"").trim().replace(/[^0-9,.-]/g,"");if(x.includes(","))x=x.replace(/\\./g,"").replace(",",".");const n=Number(x);return Number.isFinite(n)?n:0};window.V254_DIVERGENCIAS_MOTOR_NCM={"84713000":[]};');
 w.eval(src);return w}
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V260: '+n)};
const itens=[{chave_documento:'A1',emitente_cnpj_cpf:'11.111.111/0001-11',ncm:'8471.30.00',valor_item:'1.000,50'},{chave_documento:'A1',emitente_cnpj_cpf:'11111111000111',ncm:'02023000',valor_item:200},
 {chave_documento:'B2',emitente_cnpj_cpf:'22222222000122',ncm:'84713000',valor_item:300.25},{chave_documento:'',numero_documento:'9',emitente_cnpj_cpf:'22222222000122',ncm:'123',valor_item:0}];
let w=abrir(false),d=w.document;
await teste('menu começa expandido e o botão recolhe e expande',()=>{const b=d.getElementById('v260-toggle');assert.ok(b);assert.equal(d.body.classList.contains('v260-rec'),false);assert.equal(b.getAttribute('aria-expanded'),'true');
 b.click();assert.equal(d.body.classList.contains('v260-rec'),true);assert.equal(b.title,'Expandir o menu');assert.equal(w.classificadorV260.recolhido(),true);b.click();assert.equal(d.body.classList.contains('v260-rec'),false)});
await teste('a escolha fica gravada no navegador e vale na próxima abertura',()=>{d.getElementById('v260-toggle').click();assert.equal(w.localStorage.getItem('classificador.v260.menu'),'recolhido');
 const w2=abrir(false,'recolhido');assert.equal(w2.document.body.classList.contains('v260-rec'),true);w2.close();const w3=abrir(false,'expandido');assert.equal(w3.document.body.classList.contains('v260-rec'),false);w3.close();d.getElementById('v260-toggle').click()});
await teste('cada opção do menu recebe um ícone (sem duplicar) e o nome para leitura e dica',()=>{const links=[...d.querySelectorAll('.v123-link')];for(const l of links)assert.equal(l.querySelectorAll('.v260-ico').length,1);
 w.classificadorV260.atualizar();w.classificadorV260.atualizar();assert.equal(d.querySelectorAll('.v260-ico').length,links.length);
 assert.equal(links[1].title,'Apuração assistida da CBS');assert.equal(links[1].getAttribute('aria-label'),'Apuração assistida da CBS');assert.equal(links[1].querySelector('small').textContent,'0');assert.equal(links[1].querySelector('.v260-txt').textContent,'Apuração assistida da CBS');assert.equal(links[1].querySelectorAll('.v260-txt').length,1);assert.equal(links[1].textContent,'Apuração assistida da CBS0')});
await teste('menu bloqueado mantém o aviso de acesso; opção sem ícone próprio usa o padrão',()=>{const l=d.querySelector('[data-v123-key="dashboard"]');assert.equal(l.title,'Acesso completo após entrar com cadastro');assert.equal(l.getAttribute('aria-label'),'Dashboard');assert.ok(d.querySelector('[data-v123-key="novo"] .v260-ico path').getAttribute('d'))});
await teste('janela estreita: o menu aparece recolhido em vez de sumir, e o botão fica oculto',()=>{const n=abrir(true);assert.equal(n.document.body.classList.contains('v260-rec'),true);assert.equal(n.document.getElementById('v260-toggle').hidden,true);
 assert.match(src,/body\.v260-rec #v123-sidebar\{[^}]*display:block!important/);n.close()});
await teste('indicadores: documentos, itens, valor, emitentes, NCM distintos e NCM em revisão',()=>{const k=w.classificadorV260.indicadores(itens);assert.equal(k.documentos,3);assert.equal(k.itens,4);assert.equal(k.valor,1500.75);assert.equal(k.emitentes,2);assert.equal(k.ncms,2);assert.equal(k.revisao,1);
 const z=w.classificadorV260.indicadores([]);assert.equal(z.documentos,0);assert.equal(z.valor,0)});
await teste('faixa de indicadores: só nas telas de análise e com arquivos carregados',()=>{const k=d.getElementById('v260-kpis');assert.equal(d.querySelector('main.wrap').firstElementChild,k);assert.equal(k.hidden,true);
 w.state.items=itens;w.classificadorV260.atualizar();assert.equal(k.hidden,true);
 d.getElementById('load').classList.remove('active');d.getElementById('dashboard').classList.add('active');w.classificadorV260.atualizar();assert.equal(k.hidden,false);assert.equal(k.querySelectorAll('.v260-kpi').length,5);
 assert.match(k.textContent,/R\$ 1\.500,75/);assert.match(k.textContent,/Motor × Classificador divergem/);assert.ok(k.querySelector('.v260-kpi.alerta'));
 d.body.classList.add('v219-modo-consulta');w.classificadorV260.atualizar();assert.equal(k.hidden,true);d.body.classList.remove('v219-modo-consulta');
 w.state.items=[];w.classificadorV260.atualizar();assert.equal(k.hidden,true)});
await teste('sem NCM divergente o indicador fica verde',()=>{w.state.items=[itens[1]];w.classificadorV260.atualizar();const k=d.getElementById('v260-kpis');assert.equal(k.hidden,false);assert.ok(k.querySelector('.v260-kpi.ok'));assert.match(k.textContent,/nenhuma divergência com o Motor/)});
await teste('não altera dados: sem rede e sem escrita no estado',()=>{assert.doesNotMatch(src,/fetch\(|XMLHttpRequest|state\.items\s*=|state\.items\.push|\.splice\(/)});
await teste('build: selo e título V260 e módulo presente',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO 260/);assert.match(dist,/<title>Auditoria Reforma Tributária — V260<\/title>/);assert.ok(dist.includes('V260_CARREGADO'))});
w.close();console.log(`${ok} testes focados V260 OK`);process.exit(0);
