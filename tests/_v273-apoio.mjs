/* Apoio dos testes V273: monta a página mínima com as bases reais (TIPI - Base Completa, Portal e relação NBS). */
import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {JSDOM} from 'jsdom';
export const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'..');
export function montar(){
  const dom=new JSDOM('<html><head></head><body><select id="anoPeriodo"><option>2026</option></select><button class="tab" data-tab="observacoes"></button><section id="observacoes"></section><section id="v124-metodologia"></section></body></html>',{runScripts:'dangerously',url:'https://teste.invalid/'}),w=dom.window;
  w.structuredClone=structuredClone;w.alert=()=>{};
  w.eval('var state={items:[]};var tipoOperacao=()=>"ENTRADAS";function campoGrupo(row,grupo,sufixo){const g=grupo.toUpperCase(),t=sufixo.toUpperCase(),alias=g==="CBS"?["_CBS","_IBSCBS"]:g==="IBS"?["_IBS","_IBSCBS"]:["_"+g];const x=Object.entries(row||{}).find(([k])=>{const u=k.toUpperCase();return alias.some(a=>u.includes(a))&&u.endsWith("_"+t)});return x?x[1]:""}');
  /* relação de NCM: a mesma base REF39 do módulo V39 (TIPI - Base Completa), com o ajuste do papel higiênico da V56 */
  const l=fs.readFileSync(path.join(root,'src/js/modulos/09-v39-base-ibs-cbs-validada.js'),'utf8').split('\n')[4],ref=JSON.parse(l.slice(l.indexOf('{'),l.lastIndexOf('}')+1));
  w.__REF39=ref;
  w.eval('window.classificadorReferenciaNcm=function(c){const n=String(c||"").replace(/\D/g,""),R=window.__REF39,t=R.tipi[n],u=R.u;if(n==="48181000")return {codigo:n,descricao:"- Papel higiênico",anexo:"Anexo VIII (produtos de higiene pessoal e limpeza)",cclasstrib:"200035",cst:"200",observacao:""};return {codigo:n,descricao:t?t[0]:"NCM não encontrada na TIPI - Base Completa",anexo:t?u[t[1]]:"",cclasstrib:t?u[t[2]]:"",cst:t?u[t[3]]:"",observacao:t?u[t[4]]:""}};');
  for(const f of ['dados/portal-conformidade-cst-cclasstrib-2026.js','dados/anexo-viii-correlacao-nbs.js','modulos/102-v168-cronograma-editavel-regime.js','modulos/122-v248-nbs-correlacao-nfse.js','modulos/123-v251-nfse-enquadramento-servico.js','modulos/103-v180-enquadramento-recomendado-item.js','modulos/104-v181-cfop-credito-debito-ibs-cbs.js','modulos/124-v252-aliquotas-anexos-legais.js','modulos/142-v273-validacao-ncm-nbs.js'])w.eval(fs.readFileSync(path.join(root,'src/js',f),'utf8'));
  return w;
}
export const merc=(ncm,cst,cc,valor=100)=>({tipo_documento:'NF-e',ncm,cfop:'5102',descricao_item:'Mercadoria',valor_item:valor,...(cst||cc?{item_det_imposto_IBSCBS_CST:cst||'',item_det_imposto_IBSCBS_cClassTrib:cc||''}:{})});
export const nota=(codigo,nbs,cst,cc,valor=1000)=>({tipo_documento:'NFS-e',descricao_item:'Serviço',dados_nfse:{codigo_servico:codigo,nbs,valor_servico:valor,cst_ibs_cbs:cst||'',cclasstrib:cc||''}});
