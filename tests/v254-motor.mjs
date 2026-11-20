/* V254 — Regressão do alinhamento com o Motor: CBS de 11,30% de 2027 a 2033 e NCMs divergentes
   exibidos com os dois enquadramentos, revisão obrigatória e sem redução. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const dom=new JSDOM('<html><head></head><body>'
  +'<aside id="v123-sidebar"><button class="v123-link" data-v123-key="ibs"></button><div class="v123-status"></div></aside>'
  +'<button class="tab" data-tab="load"></button><button class="tab" data-tab="items"></button><button class="tab" data-tab="icms"></button><button class="tab" data-tab="dashboard"></button>'
  +'<section id="icms" class="panel"></section><section id="dashboard" class="panel"></section></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;
w.structuredClone=structuredClone;w.alert=()=>{};
w.eval('var state={files:[],items:[],events:[],docs:[],errors:[],runId:0};var tipoOperacao=()=>"ENTRADAS";'
 +'function $(id){return document.getElementById(id)}function esc(v){return String(v??"").replace(/[&<>"\']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\'":"&#39;",\'"\':"&quot;"}[c]))}'
 +'function num(v){let x=String(v??"").trim().replace(/[^0-9,.-]/g,"");if(x.includes(","))x=x.replace(/\\./g,"").replace(",",".");const n=Number(x);return Number.isFinite(n)?n:0}'
 +'const __FMT_BRL=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"});function brl(v){return __FMT_BRL.format(Number(v||0))}'
 +'function brNumero(v,casas=2){return new Intl.NumberFormat("pt-BR",{minimumFractionDigits:casas,maximumFractionDigits:casas}).format(Number(v||0))}'
 +'function valorGrupo(row,grupo,tag){return Object.entries(row||{}).filter(([k])=>k.toUpperCase().includes("_"+grupo.toUpperCase())&&k.toUpperCase().endsWith("_"+tag.toUpperCase())).reduce((a,[,v])=>a+num(v),0)}'
 +'function valorIcms(row,tag){return Object.entries(row||{}).filter(([k])=>{const u=k.toUpperCase();return u.includes("_ICMS")&&u.endsWith("_"+tag.toUpperCase())&&!u.includes("ST")}).reduce((a,[,v])=>a+num(v),0)}'
 +'function taxPick(row,grupo,sufixo){const k=Object.keys(row||{}).find(x=>x.toUpperCase().includes("_"+grupo.toUpperCase())&&x.toUpperCase().endsWith(sufixo.toUpperCase()));return k?row[k]:""}'
 +'window.renderAba=()=>{};window.atualizarBadgesTributos=()=>{};window.gerarXlsx=()=>{};');
for(const f of ['dados/portal-conformidade-cst-cclasstrib-2026.js','dados/anexo-viii-correlacao-nbs.js','modulos/102-v168-cronograma-editavel-regime.js','modulos/122-v248-nbs-correlacao-nfse.js','modulos/123-v251-nfse-enquadramento-servico.js','modulos/103-v180-enquadramento-recomendado-item.js','modulos/104-v181-cfop-credito-debito-ibs-cbs.js','modulos/124-v252-aliquotas-anexos-legais.js','modulos/125-v253-painel-fornecedores-impacto.js','dados/v254-divergencias-motor-ncm.js','modulos/126-v254-divergencias-motor.js'])
  w.eval(fs.readFileSync(path.join(root,'src/js',f),'utf8'));
let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V254: '+nome)};
const dados=r=>w.classificadorV252DadosEnquadramento(r),base=w.V254_DIVERGENCIAS_MOTOR_NCM;
await teste('cronograma: CBS de 11,30% de 2027 a 2033 e IBS inalterado',()=>{
 for(const [ano,cbs,ibs] of [[2026,0.9,0.1],[2027,11.3,0.1],[2028,11.3,0.1],[2029,11.3,1.85],[2030,11.3,3.7],[2031,11.3,5.55],[2032,11.3,7.48],[2033,11.3,18.7]]){
  const t=w.v253TaxasAno?w.v253TaxasAno(ano-2026,null):null;if(t){assert.equal(t.cbs,cbs);assert.ok(Math.abs(t.ibsE+t.ibsM-ibs)<1e-9)}}
 for(const f of ['102-v168-cronograma-editavel-regime.js','81-v131-importacao-lote-ncm-nbs.js'])assert.match(fs.readFileSync(path.join(root,'src/js/modulos',f),'utf8'),/'CBS \(%\)':\[0\.9,11\.3,11\.3,11\.3,11\.3,11\.3,11\.3,11\.3\]/);
 assert.doesNotMatch(fs.readFileSync(path.join(root,'src/js/modulos/78-v124-modelo-referencia-fontes-cronograma.js'),'utf8'),/'8,40%'|'8,50%'/)});
await teste('base de divergências: 539 NCMs de 8 dígitos',()=>{const k=Object.keys(base);assert.equal(k.length,539);assert.ok(k.every(x=>/^\d{8}$/.test(x)))});
await teste('NCM divergente (Motor XIV × Classificador IX): revisão, dois enquadramentos e sem redução',()=>{const d=dados({tipo_documento:'NF-e',ncm:'30021211'});
 assert.equal(d.status,'REVISÃO NECESSÁRIA');assert.match(d.divergenciaMotor.texto,/Motor: Anexo XIV · Classificador: Anexo IX/);assert.match(d.reducao,/Motor e Classificador divergem/);
 for(const k of ['ibsMunicipal','ibsEstadual','cbs'])assert.equal(d.efetivas[k].valor,null)});
await teste('NCM em que só o Motor tem anexo: mostra "sem anexo" no Classificador',()=>{const d=dados({tipo_documento:'NF-e',ncm:'17025000'});assert.match(d.divergenciaMotor.texto,/Motor: Anexo VI · Classificador: sem anexo/);assert.equal(d.status,'REVISÃO NECESSÁRIA')});
await teste('NCM em que só o Classificador tem anexo: mostra "sem anexo" no Motor',()=>{const d=dados({tipo_documento:'NF-e',ncm:'10031000'});assert.match(d.divergenciaMotor.texto,/Motor: sem anexo · Classificador: .*Anexo VII/)});
await teste('NCM sem divergência mantém o enquadramento e a redução da V252',()=>{const d=dados({tipo_documento:'NF-e',ncm:'34011190'});assert.equal(d.divergenciaMotor,undefined);assert.equal(d.status,'REFERÊNCIA DOCUMENTAL');assert.match(d.reducao,/60/);
 const e=w.v253Efeito('NCM','34011190');assert.equal(e.ref.reducao,60);assert.equal(e.revisao,false)});
await teste('painel V253: NCM divergente fica em revisão, com os dois anexos e alíquota cheia',()=>{const e=w.v253Efeito('NCM','30021211');assert.equal(e.revisao,true);assert.equal(e.ref.reducao,null);assert.match(e.ref.anexo,/Motor: Anexo XIV/);assert.match(e.texto,/revisão obrigatória, sem redução aplicada/)});
await teste('NFS-e não é afetada pela base de NCM',()=>{const r={tipo_documento:'NFS-e',ncm:'30021211',dados_nfse:{codigo_servico:'01.01'}};assert.equal(dados(r).divergenciaMotor,undefined)});
await teste('build: selo e módulo V254 presentes',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO \d+/);assert.match(dist,/V254_CARREGADO/);assert.match(dist,/<title>Auditoria Reforma Tributária — V\d+<\/title>/)});
w.close();console.log(`${ok} testes focados V254 OK`);
