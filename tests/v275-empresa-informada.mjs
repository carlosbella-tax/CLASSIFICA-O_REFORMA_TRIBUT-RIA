/* V275 — Regressão: nome, CNPJ e regime informados na primeira tela não são trocados pelos dados dos documentos carregados. */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';
const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
const src=fs.readFileSync(path.join(root,'src/js/modulos/121-v242-fluxo-carga-automatico.js'),'utf8');
const esperar=ms=>new Promise(r=>setTimeout(r,ms));
const DOCS=[{emitente_razao_social:'FORNECEDOR ALFA S.A.',emitente_cnpj_cpf:'33000167000101',emitente_municipio:'CAMPINAS',destinatario_razao_social:'SELAK IND. E COM. DE EMULSOES LTDA',destinatario_cnpj_cpf:'56218522000119'},
 {emitente_razao_social:'SELAK IND. E COM. DE EMULSOES LTDA',emitente_cnpj_cpf:'56218522000119',destinatario_razao_social:'CLIENTE BETA LTDA',destinatario_cnpj_cpf:'47960950000121'}];
async function processar(campos,docs=DOCS){
 const dom=new JSDOM('<html><body><input id="empresa"><input id="cnpjEmpresa"><select id="regimeEmpresa"><option value="">Selecione</option><option value="Lucro Real">Lucro Real</option><option value="Lucro Presumido">Lucro Presumido</option></select>'
  +'<section id="load"><button id="process">Processar</button><button id="clear">Limpar</button><span id="pStatus"></span></section></body></html>',{runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window,d=w.document;
 w.eval('var state={docs:'+JSON.stringify(docs)+'};');w.eval(src);
 for(const [k,v] of Object.entries(campos))d.getElementById(k).value=v;
 d.getElementById('process').click();d.getElementById('pStatus').textContent='Concluído: 2 arquivo(s) lidos';await esperar(750);
 const r={empresa:d.getElementById('empresa').value,cnpj:d.getElementById('cnpjEmpresa').value,regime:d.getElementById('regimeEmpresa').value,nomeDoCnpj:w.classificadorV275NomeDoCnpjInformado,marca:w.V275_CARREGADO};w.close();return r}
let ok=0;const teste=async(n,f)=>{await f();ok++;console.log('OK V275: '+n)};
await teste('empresa, CNPJ e regime informados continuam os mesmos depois de processar',async()=>{
 const r=await processar({empresa:'SELAK IND. E COM. DE EMULSOES LTDA',cnpjEmpresa:'56.218.522/0001-19',regimeEmpresa:'Lucro Presumido'});
 assert.equal(r.empresa,'SELAK IND. E COM. DE EMULSOES LTDA');assert.equal(r.cnpj,'56.218.522/0001-19');assert.equal(r.regime,'Lucro Presumido');assert.equal(r.marca,true)});
await teste('nome diferente do que está nos documentos também é mantido',async()=>{
 const r=await processar({empresa:'SELAK MATRIZ',cnpjEmpresa:'56218522000119',regimeEmpresa:'Lucro Real'});assert.equal(r.empresa,'SELAK MATRIZ');assert.equal(r.cnpj,'56218522000119');assert.equal(r.regime,'Lucro Real')});
await teste('nome em branco é completado só com a razão social do CNPJ informado, não com a do primeiro documento',async()=>{
 const r=await processar({cnpjEmpresa:'56.218.522/0001-19'});assert.equal(r.empresa,'SELAK IND. E COM. DE EMULSOES LTDA');assert.equal(r.cnpj,'56.218.522/0001-19');
 const s=await processar({cnpjEmpresa:'47.960.950/0001-21'});assert.equal(s.empresa,'CLIENTE BETA LTDA')});
await teste('CNPJ informado que não aparece nos documentos: nome continua em branco',async()=>{
 const r=await processar({cnpjEmpresa:'11.222.333/0001-81'});assert.equal(r.empresa,'');assert.equal(r.cnpj,'11.222.333/0001-81')});
await teste('nada informado: nenhum dado de documento vai para os campos da empresa',async()=>{
 const r=await processar({});assert.equal(r.empresa,'');assert.equal(r.cnpj,'');assert.equal(r.regime,'')});
await teste('nenhum módulo grava nos campos da empresa a partir dos documentos; build com a versão',async()=>{
 assert.doesNotMatch(src,/preencher\('cnpjEmpresa'/);assert.doesNotMatch(src,/preencher\('empresa',\(?nomeEmi/);
 const dir=path.join(root,'src/js/modulos');
 for(const f of fs.readdirSync(dir)){const t=fs.readFileSync(path.join(dir,f),'utf8');assert.doesNotMatch(t,/(emitente|destinatario)_(razao_social|cnpj_cpf)[^;\n]{0,80}['"](empresa|cnpjEmpresa)['"]/,f);if(!f.startsWith('121-'))assert.doesNotMatch(t,/preencher\('(empresa|cnpjEmpresa|regimeEmpresa)'/,f)}
 const dist=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');assert.ok(dist.includes('V275_CARREGADO'));assert.ok(JSON.parse(fs.readFileSync(path.join(root,'versao.json'),'utf8')).versao>=275)});
console.log(ok+' testes focados V275 OK');process.exit(0);
