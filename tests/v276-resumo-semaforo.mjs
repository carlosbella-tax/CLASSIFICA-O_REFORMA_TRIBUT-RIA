/* V276 — Regressão: Resumo por semáforo explicativo (conclusão em números, significado e ação de cada cor,
   como ler cada coluna, exemplo de cálculo e avisos). */
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
let ok=0;const teste=async(nome,fn)=>{await fn();ok++;console.log('OK V276: '+nome)};
w.document.body.insertAdjacentHTML('beforeend','<input id="cnpjEmpresa" value="11.222.333/0001-81"><input id="anoPeriodo" value="2026"><input id="empresa" value=""><select id="periodo"><option></option></select><select id="regimeEmpresa"><option></option></select>');
const item=(ncm,valor,pis,cofins,ipi)=>({arquivo_origem:'a.xml',tipo_documento:'NF-e/NFC-e',chave_documento:'k'+ncm,numero_item:1,emitente_cnpj_cpf:'12345678000255',emitente_razao_social:'FORNECEDOR ALFA LTDA',destinatario_cnpj_cpf:'11222333000181',ncm,quantidade:'1',valor_item:valor,
 ...(pis?{item_PIS_vPIS:pis}:{}),...(cofins?{item_COFINS_vCOFINS:cofins}:{}),...(ipi?{item_IPI_vIPI:ipi}:{})});
w.state.items=[item('84145990','1000,00','16,50','76,00','100,00'),item('34011190','1000,00','16,50','76,00',''),item('22030000','1000,00','100,00','200,00','100,00')];
w.renderAba('ncm2');
const box=w.document.getElementById('v253NcmResumo'),txt=()=>box.textContent.replace(/\s+/g,' ');
await teste('quadro abre com a frase do que ele compara e a conclusão em números da carga',()=>{assert.equal(box.hidden,false);
 assert.match(txt(),/soma, por cor do semáforo, todos os códigos dos documentos carregados e compara o tributo que eles carregam hoje com o que carregariam em 2033/);
 const c=box.querySelector('.v276-conclusao').textContent;assert.match(c,/Foram analisados 3 código\(s\), com R\$\s3\.000,00 movimentados/);
 assert.match(c,/Hoje esses itens têm R\$\s685,00 de PIS, COFINS e IPI destacados\. Em 2033 teriam R\$\s720,00 de IBS e CBS estimados: aumento de R\$\s35,00 \(5,11%\)\./)});
await teste('conclusão por cor: só as cores com código, com quantidade, valor, participação e efeito',()=>{const li=[...box.querySelectorAll('.v276-conclusao li')].map(x=>x.textContent);assert.equal(li.length,2);
 assert.match(li[0],/^NEGATIVO 2 código\(s\), R\$\s2\.000,00 movimentados \(66,67% do total\): a carga estimada sobe R\$\s135,00\.$/);
 assert.match(li[1],/^FAVORÁVEL 1 código\(s\), R\$\s1\.000,00 movimentados \(33,33% do total\): a carga estimada cai R\$\s100,00\.$/)});
await teste('tabela: cada cor com o que significa e o que fazer; total sem texto; valores somados conferem',()=>{const trs=[...box.querySelectorAll('#v253NcmResumoTable tbody tr')];assert.equal(trs.length,5);
 assert.equal(box.querySelectorAll('#v253NcmResumoTable thead th')[1].textContent,'O que significa');
 assert.match(trs[0].cells[1].textContent,/mais de 2% acima da atual.*O que fazer: Rever preço, margem e contratos/);assert.match(trs[1].cells[1].textContent,/até 2% acima ou abaixo.*O que fazer: Acompanhar/);
 assert.match(trs[2].cells[1].textContent,/mais de 2% abaixo.*O que fazer: Confirmar o enquadramento/);assert.match(trs[3].cells[1].textContent,/não tem PIS, COFINS nem IPI destacados.*O que fazer: Conferir o enquadramento/);
 assert.equal(trs[4].cells[1].textContent,'');assert.match(trs[4].cells[0].textContent,/^TOTAL$/);
 const n=c=>trs.map(t=>w.num(t.cells[c].textContent));for(const c of [2,3,5,6,7]){const v=n(c);assert.ok(Math.abs(v[0]+v[1]+v[2]+v[3]-v[4])<0.01,'coluna '+c)}});
await teste('como ler cada coluna: seis colunas explicadas, com as alíquotas de 2033 do cronograma',()=>{const dt=[...box.querySelectorAll('.v276-ajuda dt')].map(x=>x.textContent);
 assert.equal(dt.join('|'),'Códigos|Valor movimentado|Participação|Carga atual (PIS+COFINS+IPI)|IBS+CBS 2033 estimado|Diferença 2033');
 const dd=[...box.querySelectorAll('.v276-ajuda dd')].map(x=>x.textContent);assert.match(dd[3],/ICMS e ISS não entram nesta conta/);
 assert.match(dd[4],/CBS 11,30% \+ IBS estadual 16,20% \+ IBS municipal 2,50% = 30,00%/);assert.match(dd[5],/Valor positivo \(vermelho\) é carga maior; valor negativo \(verde\) é carga menor/)});
await teste('exemplo de cálculo usa um código da própria carga e fecha a conta',()=>{const e=box.querySelector('.v276-exemplo').textContent;
 assert.match(e,/NCM 84145990: R\$\s1\.000,00 movimentados × 30,00% \(alíquota de 2033, sem redução\) = R\$\s300,00 de IBS e CBS\. Carga atual destacada: R\$\s192,50\. Diferença: R\$\s107,50, por isso o código está em NEGATIVO\./)});
await teste('exemplo com redução cita o percentual da redução',()=>{const rows=[{chave:'NCM 34011190',semaforo:'NEGATIVO',valor_total:1000,carga_atual:92.5,novo_2033:120,diferenca:27.5,aliq_cbs_ef:4.52,aliq_ibsE_ef:6.48,aliq_ibsM_ef:1,reducao:60}];
 assert.match(w.v276ExplicacaoSemaforo(rows).exemplo,/× 12,00% \(alíquota de 2033 já com a redução de 60,00%\) = R\$\s120,00/)});
await teste('avisos: ICMS e ISS fora da carga atual, estimativa sem créditos e filtros que não mudam o quadro',()=>{const li=[...box.querySelectorAll('.v276-avisos li')].map(x=>x.textContent);assert.equal(li.length,3);
 assert.match(li[0],/IBS substitui o ICMS e o ISS.*some o ICMS e o ISS de hoje/);assert.match(li[1],/sem descontar os créditos de IBS e CBS das compras\. Não é apuração nem valor a recolher/);assert.match(li[2],/filtros da pesquisa da tabela acima não mudam este quadro/)});
await teste('carga que reduz ou não muda: texto de redução e de sem diferença; sem carga atual não mostra percentual',()=>{const E=w.v276ExplicacaoSemaforo;
 assert.match(E([{semaforo:'FAVORÁVEL',valor_total:1000,carga_atual:400,novo_2033:300,diferenca:-100}]).geral[1],/redução de R\$\s100,00 \(25,00%\)\./);
 assert.match(E([{semaforo:'NEUTRO',valor_total:1000,carga_atual:300,novo_2033:300,diferenca:0}]).geral[1],/sem diferença\./);
 assert.match(E([{semaforo:'NEGATIVO',valor_total:1000,carga_atual:0,novo_2033:300,diferenca:300}]).geral[1],/aumento de R\$\s300,00\.$/);
 assert.match(E([{semaforo:'—',valor_total:500,carga_atual:0,novo_2033:0,diferenca:0}]).cores[0].texto,/sem tributo destacado hoje e sem IBS e CBS calculados/)});
await teste('filtro da pesquisa muda a tabela de códigos e não muda o resumo',()=>{const antes=txt();const s=w.document.getElementById('v253NcmSemaforo');s.value='FAVORÁVEL';s.dispatchEvent(new w.Event('input'));
 assert.equal(w.document.querySelectorAll('#v253NcmTable tbody .v253-ncm-row').length,1);assert.equal(txt(),antes);s.value='';s.dispatchEvent(new w.Event('input'))});
await teste('exportação: resumo com o significado e a ação de cada cor e a planilha "Como ler o resumo"',()=>{let cap=null;w.eval('var gerarXlsx');w.gerarXlsx=(n,f)=>{cap={n,f}};w.eval('gerarXlsx=window.gerarXlsx');
 w.document.getElementById('v253NcmExportar').click();assert.ok(cap);assert.equal(cap.f.map(x=>x[0]).join('|'),'Análise por NCM|Resumo por semáforo|Como ler o resumo');
 const r=cap.f[1][1];assert.equal(r.length,5);assert.match(r[0].o_que_significa,/mais de 2% acima/);assert.match(r[0].o_que_fazer,/Rever preço/);assert.equal(r[4].semaforo,'TOTAL');assert.equal(r[4].o_que_fazer,'');assert.equal(r[4].valor_movimentado,'3.000,00');
 const c=cap.f[2][1];assert.ok(c.length>=13);assert.ok(c.every(x=>x.assunto&&x.explicacao));assert.ok(c.some(x=>x.assunto==='Exemplo de cálculo'));assert.equal(c.filter(x=>x.assunto==='Atenção ao interpretar').length,3);assert.equal(c.filter(x=>/^Coluna: /.test(x.assunto)).length,6)});
await teste('build com a versão e o quadro novo',()=>{const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.ok(dist.includes('V276_CARREGADO'));assert.ok(!dist.includes('Soma de todos os códigos analisados, sem os filtros da pesquisa.'));
 assert.ok(JSON.parse(fs.readFileSync(path.join(root,'versao.json'),'utf8')).versao>=276)});
w.close();console.log(ok+' testes focados V276 OK');process.exit(0);
