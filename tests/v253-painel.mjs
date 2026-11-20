/* V253 — Regressão do Painel de Fornecedores e Impacto da Reforma:
   parser de SPED (EFD ICMS/IPI e Contribuições), exclusão de DANFSe pelo
   intercept DANFE, agregação de fornecedores com regime, semáforo de
   impacto e linha do tempo 2026–2033. */
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
for(const f of ['dados/portal-conformidade-cst-cclasstrib-2026.js','dados/anexo-viii-correlacao-nbs.js','modulos/102-v168-cronograma-editavel-regime.js','modulos/122-v248-nbs-correlacao-nfse.js','modulos/123-v251-nfse-enquadramento-servico.js','modulos/103-v180-enquadramento-recomendado-item.js','modulos/104-v181-cfop-credito-debito-ibs-cbs.js','modulos/124-v252-aliquotas-anexos-legais.js','modulos/125-v253-painel-fornecedores-impacto.js'])
  w.eval(fs.readFileSync(path.join(root,'src/js',f),'utf8'));
let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V253: '+nome)};
const chave44='26'+'2611'+'12345678000199'+'55'+'001'+'000000100'+'1'+'00010001'+'1';
const spedIcms=['|0000|050|0|01112026|30112026|EMPRESA TESTE LTDA|12345678000199|SP|123456780001|01012026|31122026|0|0|',
 '|0150|F001|FORNECEDOR ALFA LTDA|1058|12345678000255||ISENTO|3521502|',
 '|0200|PROD1|00|PRODUTO ALFA UNIDADE|||UN|UN|0|12345678|||10|',
 '|C100|0|1|F001|55|00|1|1001|'+chave44+'|01112026|01112026|1000,00|0|0,00|0,00|1000,00|9|0,00|0,00|0,00|180,00|0,00|0,00|0,00|',
 '|C170|1|PROD1|ITEM DESCRIÇÃO COMPLETA|10,000|UN|1000,00|0,00|0|100|5102|180,00|18,00|180,00|0,00|0,00|0,00|0|49|999|0,00|0,00|0,00|01|1000,00|1,65|0,00|16,50|49|1000,00|7,60|0,00|76,00|',
 '|C100|1|0|C001|55|00|1|2001||01112026|01112026|2000,00|0|0,00|0,00|2000,00|9|0,00|0,00|0,00|360,00|0,00|0,00|0,00|',
 '|C170|1|PROD1|VENDA ITEM|10,000|UN|2000,00|0,00|0|100|6102|360,00|18,00|360,00|0,00|0,00|0,00|0|49|999|0,00|0,00|0,00|01|2000,00|1,65|0,00|33,00|49|2000,00|7,60|0,00|152,00|'].join('\r\n');
const spedContrib=['|0000|017|0|01112026|30112026|0,00|0,00|98765432000188||EMPRESA SERVICOS LTDA|',
 '|0150|J001|JOAO PRESTADOR|1058|98765432000310||ISENTO|3521502|',
 '|0200|SRV1|99|SERVIÇO DE MANUTENÇÃO|||UN|UN||',
 '|A100|0|1|J001|00|0||3001|ABC123|01112026|01112026|500,00|0|0,00|500,00|8,25|500,00|38,25|0,00|0,00|27,50|',
 '|A170|1|SRV1|DETALHE SERVIÇO|500,00|0,00|0|01|500,00|1,65|8,25|51|500,00|7,65|38,25|',
 '|F100|1|C001|DOC|01112026|1200,00|01|1200,00|1,65|19,80|51|1200,00|7,65|91,80|||CTA|CCUS|OPERAÇÃO TESTE BLOCO F|'].join('\r\n');
const file=n=>({name:n,webkitRelativePath:''});
await teste('SPED ICMS/IPI: C170 vira item com NCM do cadastro 0200',()=>{const [rows]=w.parse(file('SPED.TXT'),spedIcms);assert.equal(rows.length,2);assert.equal(rows[0].ncm,'12345678');assert.equal(w.num(rows[0].valor_item),1000);assert.equal(rows[0].tipo_documento,'SPED EFD ICMS/IPI')});
await teste('SPED ICMS/IPI: entrada traz emitente do 0150 e saída traz o declarante',()=>{const [rows]=w.parse(file('SPED.TXT'),spedIcms);assert.equal(rows[0].emitente_cnpj_cpf,'12345678000255');assert.equal(rows[0].emitente_razao_social,'FORNECEDOR ALFA LTDA');assert.equal(rows[1].emitente_cnpj_cpf,'12345678000199')});
await teste('SPED ICMS/IPI: PIS, COFINS, IPI e chave de 44 dígitos preservados',()=>{const [rows]=w.parse(file('SPED.TXT'),spedIcms);assert.equal(w.num(rows[0].item_PIS_vPIS),16.5);assert.equal(w.num(rows[0].item_COFINS_vCOFINS),76);assert.equal(rows[0].item_IPI_CST,'49');assert.equal(rows[0].chave_documento.length,44);assert.equal(rows[0].data_emissao,'2026-11-01')});
await teste('SPED Contribuições: A170 detalha o serviço e F100 soma operações',()=>{const [rows,doc]=w.parse(file('SPEDC.TXT'),spedContrib);assert.equal(doc.tipo_documento,'SPED EFD Contribuições');assert.equal(rows.length,2);assert.equal(w.num(rows[0].item_PIS_vPIS),8.25);assert.equal(w.num(rows[0].item_COFINS_vCOFINS),38.25);assert.equal(w.num(rows[1].item_PIS_vPIS),19.8);assert.equal(w.num(rows[1].item_COFINS_vCOFINS),91.8)});
await teste('SPED Contribuições: serviço contratado identifica o prestador pelo 0150',()=>{const [rows]=w.parse(file('SPEDC.TXT'),spedContrib);assert.equal(rows[0].emitente_cnpj_cpf,'98765432000310')});
await teste('intercept DANFE: DANFSe (NOTA FISCAL DE SERVIÇO / ISS) não é lida como NF-e',()=>{const danfse='DANFSe — NOTA FISCAL ELETRÔNICA DE SERVIÇO\nPRESTAÇÃO DE SERVIÇOS\nCÓDIGO DE VERIFICAÇÃO ABCD\nISS RETIDO\n35'+String(chave44).slice(2)+'00';assert.equal(w.v253InterceptaDanfe(danfse),false)});
await teste('intercept DANFE: DANFE de NF-e com CHAVE DE ACESSO e MODELO 55 é reconhecida',()=>{assert.equal(w.v253InterceptaDanfe('DANFE — NOTA FISCAL ELETRÔNICA\nCHAVE DE ACESSO\n'+chave44+' \nMODELO 55'),true)});
await teste('intercept DANFE: PDF sem sinal fiscal algum fica fora do leitor V253',()=>{assert.equal(w.v253InterceptaDanfe('CONTAS DE LUZ DO MÊS'),false)});
const sem=w.semaforoV253||(()=>null);
await teste('semáforo: reforma com redução fica verde, sem margem fica amarelo, acima de 2% fica vermelho',()=>{assert.equal(w.v253Semaforo(100,85).cls,'verde');assert.equal(w.v253Semaforo(100,101).cls,'amarelo');assert.equal(w.v253Semaforo(100,110).cls,'vermelho')});
await teste('semáforo: sem carga atual e com IBS/CBS calculado sinaliza atenção (vermelho)',()=>{assert.equal(w.v253Semaforo(0,50).cls,'vermelho');assert.equal(w.v253Semaforo(0,0).cls,'cinza')});
await teste('cronograma 2033 aplica as alíquotas cheias e a redução única sobre as três esferas',()=>{const t=w.v253TaxasAno(7,60);assert.ok(Math.abs(t.cbs-3.4)<1e-9);assert.ok(Math.abs(t.ibsE-6.48)<1e-9);assert.ok(Math.abs(t.ibsM-1.0)<1e-9);const tSem=w.v253TaxasAno(0,null);assert.ok(Math.abs(tSem.cbs-0.9)<1e-9)});
await teste('efeito usa o motor V252: redução única de 60% e anexo com artigo',()=>{const e=w.v253Efeito('NCM','34011190');assert.match(e.texto,/Redução única de 60,00%/);assert.match(e.ref.anexo,/Anexo VIII/);assert.match(e.ref.anexo,/art\. 136/)});
await teste('efeito: NCM sem referência exata cai para correlação por capítulo, sem inventar',()=>{const e=w.v253Efeito('NCM','87115010');assert.ok(e.texto.length>0)});
await teste('abas V253 criadas no menu e na barra de abas com contadores',()=>{assert.ok(w.document.querySelector('.tab[data-tab="fornecedores"]'));assert.ok(w.document.querySelector('.tab[data-tab="ncm2"]'));assert.ok(w.document.querySelector('.v123-link[data-v123-key="fornecedores"]'));assert.ok(w.document.querySelector('#v253FornTable'))});
await teste('agregação de fornecedores: CNPJ consolidado, regime por CSOSN e valores somados',()=>{w.state.items=[
 {arquivo_origem:'a.xml',tipo_documento:'NF-e/NFC-e',chave_documento:'k1',numero_item:1,emitente_cnpj_cpf:'12345678000255',emitente_razao_social:'FORNECEDOR ALFA LTDA',emitente_uf:'SP',destinatario_cnpj_cpf:'11222333000181',ncm:'02023000',quantidade:'2',valor_item:'100,00',item_ICMS_CSOSN:'102'},
 {arquivo_origem:'a.xml',tipo_documento:'NF-e/NFC-e',chave_documento:'k2',numero_item:1,emitente_cnpj_cpf:'12345678000255',emitente_razao_social:'FORNECEDOR ALFA LTDA',destinatario_cnpj_cpf:'11222333000181',ncm:'22030000',valor_item:'50,00',item_PIS_vBC:'50,00',item_PIS_pPIS:'1,65',item_PIS_vPIS:'0,83',item_COFINS_vBC:'50,00',item_COFINS_pCOFINS:'7,60',item_COFINS_vCOFINS:'3,80'}];
 w.document.getElementById('cnpjEmpresa')||w.document.body.insertAdjacentHTML('beforeend','<input id="cnpjEmpresa" value="11.222.333/0001-81"><input id="anoPeriodo" value="2026"><input id="empresa" value=""><select id="periodo"><option></option></select><select id="regimeEmpresa"><option></option></select>');
 w.renderAba('fornecedores');const tb=w.document.querySelector('#v253FornTable tbody');
 assert.equal(tb.querySelectorAll('tr').length,1);assert.match(tb.textContent,/12\.345\.678\/0002-55/);assert.match(tb.textContent,/Simples Nacional \(CSOSN 102\)/);assert.match(tb.textContent,/R\$\s*150,00/)});
await teste('análise por NCM: linha do tempo 2026–2033 com as fases da transição e banner RAD',()=>{w.renderAba('ncm2');const tb=w.document.querySelector('#v253NcmTable tbody');const linhas=tb.querySelectorAll('.v253-ncm-row');
 assert.equal(linhas.length,2);linhas[0].click();
 const tl=w.document.querySelector('.v253-timeline-tr');assert.ok(tl);assert.equal(tl.querySelectorAll('.v253-timeline tbody tr').length,8);assert.match(tl.textContent,/Fase de teste/);assert.match(tl.textContent,/Extinção PIS\/COFINS|Transição/);
 assert.match(w.document.querySelector('#v253Rad').textContent,/RAD|Sem exposição/)});
await teste('exportação respeita as linhas analisadas e a versão fica no selo do build',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.match(dist,/class="build">VERSÃO 253/);assert.match(dist,/V253_CARREGADO/);assert.match(fs.readFileSync(path.join(root,'versao.json'),'utf8'),/"versao": 253/)});
w.close();console.log(`${ok} testes focados V253 OK`);
